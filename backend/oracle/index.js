'use strict';

require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const PQueue = require('p-queue').default;
const Database = require('better-sqlite3');
const { ethers } = require('ethers');
const winston = require('winston');

/**
 * Generate trap-aware OTP using the same algorithm as frontend
 */
function generateTrapOTP(seed, blockHash, trapTriggered, digits = 6) {
    const trapState = trapTriggered ? 'TRIGGERED' : 'SAFE';
    const timeStep = Math.floor(Date.now() / 1000 / 30); // 30-second intervals
    
    const combinedData = `${seed}:${blockHash}:${trapState}:${timeStep}`;
    
    // Generate HMAC using Node.js crypto
    const hmac = crypto.createHmac('sha256', seed).update(combinedData).digest('hex');
    
    // Extract code from HMAC
    const offset = parseInt(hmac.slice(-1), 16);
    const code = parseInt(hmac.substr(offset * 2, 8), 16);
    
    return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

/**
 * Validate OTP code
 */
function validateTrapOTP(code, seed, blockHash, trapTriggered, digits = 6) {
    const expectedCode = generateTrapOTP(seed, blockHash, trapTriggered, digits);
    return code === expectedCode;
}

// ---------- config ----------
const {
  PROVIDER_URL,
  ORACLE_PRIVATE_KEY,
  VERIFIER_CONTRACT_ADDRESS,
  VERIFIER_ABI_PATH,
  MASTER_ENC_KEY,
  API_HMAC_KEY,
  PORT,
  RATE_LIMIT_WINDOW_MS = 60000,
  RATE_LIMIT_MAX = 120,
  GAS_LIMIT = 300000
} = process.env;

if (!PROVIDER_URL || !ORACLE_PRIVATE_KEY || !VERIFIER_CONTRACT_ADDRESS || !VERIFIER_ABI_PATH || !MASTER_ENC_KEY || !API_HMAC_KEY) {
  console.error('Missing required .env variables. See .env.example');
  process.exit(1);
}

// ---------- logging ----------
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()]
});

// ---------- sqlite DB ----------
const DB_PATH = path.join(__dirname, 'oracle.sqlite');
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Create tables if missing
db.prepare(`CREATE TABLE IF NOT EXISTS users (
  userId TEXT PRIMARY KEY,
  secret_enc TEXT NOT NULL,
  trapId TEXT NOT NULL,
  chainId INTEGER NOT NULL,
  createdAt INTEGER NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS submissions (
  requestId TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  code TEXT NOT NULL,
  createdAt INTEGER NOT NULL
)`).run();

db.prepare(`CREATE TABLE IF NOT EXISTS processed (
  requestId TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  oracleTxHash TEXT,
  fulfilledAt INTEGER NOT NULL
)`).run();

// prepared statements
const insertUserStmt = db.prepare('INSERT OR REPLACE INTO users (userId, secret_enc, trapId, chainId, createdAt) VALUES (?, ?, ?, ?, ?)');
const getUserStmt = db.prepare('SELECT secret_enc, trapId, chainId FROM users WHERE userId = ?');
const insertSubmissionStmt = db.prepare('INSERT OR REPLACE INTO submissions (requestId, userId, code, createdAt) VALUES (?, ?, ?, ?)');
const getSubmissionStmt = db.prepare('SELECT userId, code, createdAt FROM submissions WHERE requestId = ?');
const deleteSubmissionStmt = db.prepare('DELETE FROM submissions WHERE requestId = ?');
const insertProcessedStmt = db.prepare('INSERT OR REPLACE INTO processed (requestId, status, oracleTxHash, fulfilledAt) VALUES (?, ?, ?, ?)');
const getProcessedStmt = db.prepare('SELECT status, oracleTxHash, fulfilledAt FROM processed WHERE requestId = ?');

// ---------- encryption helpers ----------
const MASTER_KEY = Buffer.from(MASTER_ENC_KEY, 'hex');
if (MASTER_KEY.length !== 32) {
  logger.error('MASTER_ENC_KEY must be 32 bytes hex');
  process.exit(1);
}

function encryptSeed(seedPlainUtf8) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const enc = Buffer.concat([cipher.update(Buffer.from(seedPlainUtf8, 'utf8')), cipher.final()]);
  const tag = cipher.getAuthTag();
  return JSON.stringify({ iv: iv.toString('hex'), content: enc.toString('hex'), tag: tag.toString('hex') });
}

function decryptSeed(encJson) {
  const obj = JSON.parse(encJson);
  const iv = Buffer.from(obj.iv, 'hex');
  const content = Buffer.from(obj.content, 'hex');
  const tag = Buffer.from(obj.tag, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(content), decipher.final()]);
  return dec.toString('utf8');
}

// ---------- HMAC auth helper (backend -> oracle) ----------
const API_HMAC_KEY_BUF = Buffer.from(API_HMAC_KEY, 'hex');
function verifyHmac(reqBodyRaw, signatureHeader) {
  // signatureHeader format: "sha256=hex"
  if (!signatureHeader || !reqBodyRaw) return false;
  const [alg, hex] = signatureHeader.split('=');
  if (alg !== 'sha256' || !hex) return false;
  const h = crypto.createHmac('sha256', API_HMAC_KEY_BUF).update(reqBodyRaw).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(hex));
}

// ---------- ethers setup ----------
const provider = new ethers.JsonRpcProvider(PROVIDER_URL);
const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
const verifierAbi = JSON.parse(fs.readFileSync(path.join(__dirname, VERIFIER_ABI_PATH), 'utf8'));
const verifier = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, verifierAbi, wallet);

/**
 * Get trap state from contract
 */
async function getTrapState(provider, trapAddress, userIdBytes32, chainId, verifierAddress) {
    try {
        // ABI for a generic trap contract with a shouldRespond function
        const trapABI = [
            "function shouldRespond(bytes32 userId, uint256 chainId, address verifierAddress) public view returns (bool)"
        ];

        const trapContract = new ethers.Contract(trapAddress, trapABI, provider);
        
        const result = await trapContract.shouldRespond(userIdBytes32, chainId, verifierAddress);
        return result;
    } catch (error) {
        logger.warn(`Failed to check trap state for ${trapAddress}. Error: ${error.message}`);
        // Fallback to a default safe state if on-chain check fails
        return false; 
    }
}

// ---------- queue for event processing ----------
const queue = new PQueue({ concurrency: 3 }); // tune concurrency

// ---------- Express API for backend to submit code ----------
const app = express();
app.use(helmet());
app.use(express.json({ limit: '10kb', verify: (req, res, buf, encoding) => { if (buf && buf.length) { req.rawBody = buf.toString(encoding || 'utf8'); } } }));

// rate limiter
const limiter = rateLimit({ windowMs: Number(RATE_LIMIT_WINDOW_MS), max: Number(RATE_LIMIT_MAX) });
app.use(limiter);

// submit code endpoint
// body: { requestId: '0x..', userId: '0x..', code: '123456' }
app.post('/submit-code', (req, res) => {
  try {
    const sig = req.header('x-hmac-signature');
    if (!verifyHmac(req.rawBody, sig)) {
      logger.warn('HMAC auth failed for submit-code');
      return res.status(401).send({ ok: false, error: 'auth_failed' });
    }

    const { requestId, userId, code } = req.body;
    if (!requestId || !userId || !code) return res.status(400).send({ ok: false, error: 'bad_payload' });

    // store submission
    const now = Math.floor(Date.now() / 1000);
    insertSubmissionStmt.run(requestId, userId, code, now);
    logger.info(`Stored submission ${requestId} for user ${userId}`);

    return res.json({ ok: true });
  } catch (err) {
    logger.error('submit-code error', err);
    return res.status(500).send({ ok: false, error: 'server_error' });
  }
});

// health
app.get('/health', (req, res) => res.json({ ok: true, uptime: process.uptime() }));

// simple admin: add user (encrypted seed) — this should be protected in production (admin HMAC or TLS client cert)
app.post('/admin/add-user', (req, res) => {
  const sig = req.header('x-hmac-signature');
  if (!verifyHmac(req.rawBody, sig)) {
    logger.warn('HMAC auth failed for admin/add-user');
    return res.status(401).send({ ok: false, error: 'auth_failed' });
  }

  const { userId, seed, trapId, chainId } = req.body;
  if (!userId || !seed || !trapId || !chainId) return res.status(400).send({ ok: false, error: 'bad_payload' });
  const enc = encryptSeed(seed);
  const now = Math.floor(Date.now() / 1000);
  insertUserStmt.run(userId, enc, trapId, chainId, now);
  logger.info(`Added user ${userId}`);
  return res.json({ ok: true });
});

// start HTTPS or HTTP - recommend reverse proxy with TLS (nginx) in production; here we use HTTP on port and expect nginx to terminate TLS
const server = app.listen(PORT, () => {
  logger.info(`Oracle API listening on port ${PORT}`);
});

// ---------- event listener: VerificationRequested ----------
async function onVerificationRequested(event) {
  // event fields vary by ABI order. We will parse it via event args.
  try {
    const args = event.args;
    const requestId = args.requestId;
    const userId = ethers.decodeBytes32String(args.userId);
    const createdAt = Number(args.createdAt);
    const expiryAt = Number(args.expiryAt);

    const requestKey = requestId.toString();
    logger.info(`Event: VerificationRequested ${requestKey} user=${userId}`);

    // enqueue processing
    queue.add(() => processRequest(requestKey, userId, expiryAt)).catch(err => {
      logger.error('Failed to queue processRequest', err);
    });
  } catch (err) {
    logger.error('onVerificationRequested parse error', err);
  }
}

verifier.on('VerificationRequested', (...args) => {
  // ethers v6: last arg is the event object; but our parsing uses event.args inside handler
  const event = args[args.length - 1];
  onVerificationRequested(event).catch(e => logger.error(e));
});

// ---------- processRequest (core logic) ----------
async function processRequest(requestId, userId, expiryAt) {
  logger.info(`Processing request ${requestId}`);

  // idempotency: if already processed, skip
  const processed = getProcessedStmt.get(requestId);
  if (processed) {
    logger.info(`Request ${requestId} already processed: ${processed.status}`);
    return;
  }

  // check expiry
  const now = Math.floor(Date.now() / 1000);
  if (now > expiryAt) {
    logger.warn(`Request ${requestId} expired at ${expiryAt} (now ${now})`);
    insertProcessedStmt.run(requestId, 'failed', null, now);
    return;
  }

  // find submission (backend should have submitted the code)
  let sub;
  let attempts = 0;
  const maxSubmissionAttempts = 10; // Increased from 5
  const submissionDelay = 2000; // Increased from 1000ms

  while (!sub && attempts < maxSubmissionAttempts) {
    sub = getSubmissionStmt.get(requestId);
    if (!sub) {
      logger.warn(`Submission for request ${requestId} not found yet. Retrying... (attempt ${attempts + 1}/${maxSubmissionAttempts})`);
      await sleep(submissionDelay);
      attempts++;
    }
  }

  if (!sub) {
    logger.warn(`No submission for request ${requestId} after multiple attempts — cannot verify yet`);
    await retryWaitAndRequeue(requestId, userId, expiryAt, 3);
    return;
  }

  // decrypt user's seed
  const userRow = getUserStmt.get(sub.userId);
  if (!userRow) {
    logger.warn(`No seed for user ${sub.userId} — failing request ${requestId}`);
    const nowTs = Math.floor(Date.now() / 1000);
    insertProcessedStmt.run(requestId, 'failed', null, nowTs);
    deleteSubmissionStmt.run(requestId);
    return;
  }

  let seed;
  try {
    seed = decryptSeed(userRow.secret_enc);
  } catch (err) {
    logger.error('Failed to decrypt seed', err);
    const nowTs = Math.floor(Date.now() / 1000);
    insertProcessedStmt.run(requestId, 'failed', null, nowTs);
    deleteSubmissionStmt.run(requestId);
    return;
  }

  // Fetch actual blockHash and trapTriggered status
  let blockHash = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Default to zero hash
  let trapTriggered = false;
  try {
    const latestBlock = await provider.getBlock('latest');
    if (latestBlock && latestBlock.hash) {
      blockHash = latestBlock.hash;
    }

    // Get trapId from user data (assuming it's stored with the user)
    const user = getUserStmt.get(userId);
    if (user && user.trapId && user.chainId) { // Assuming chainId is also stored with user
      const userIdBytes32 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userId));
      trapTriggered = await getTrapState(provider, user.trapId, userIdBytes32, user.chainId, VERIFIER_CONTRACT_ADDRESS);
    } else {
      logger.warn(`Trap ID or Chain ID not found for user ${userId}. Cannot check trap state.`);
    }
  } catch (err) {
    logger.error('Error fetching block hash or trap state', err);
  }

  const submittedCode = sub.code;
  const success = validateTrapOTP(submittedCode, seed, blockHash, trapTriggered);

  // attempt on-chain fulfill with retry/backoff
  try {
    const txHash = await fulfillOnChainWithRetry(requestId, success);
    insertProcessedStmt.run(requestId, success ? 'success' : 'failed', txHash, Math.floor(Date.now() / 1000));
    deleteSubmissionStmt.run(requestId);
    logger.info(`Request ${requestId} processed: success=${success} tx=${txHash}`);
  } catch (err) {
    logger.error('Failed to fulfill on-chain after retries', err);
    // leave submission in DB for manual reconciliation or retry
  }
}

function timingSafeCompare(a, b) {
  const aBuf = Buffer.from(String(a));
  const bBuf = Buffer.from(String(b));
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

// ---------- retry helpers ----------
async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function retryWaitAndRequeue(requestId, userId, expiryAt, retriesLeft) {
  if (retriesLeft <= 0) {
    logger.warn(`Retries exhausted for ${requestId} — marking failed`);
    insertProcessedStmt.run(requestId, 'failed', null, Math.floor(Date.now() / 1000));
    return;
  }
  // wait some time (exponential backoff)
  const delay = (4 - retriesLeft) * 2000 + 5000; // 5s,7s,9s etc
  logger.info(`Will retry request ${requestId} after ${delay}ms (${retriesLeft} left)`);
  await sleep(delay);
  // re-add to queue
  queue.add(() => processRequest(requestId, userId, expiryAt)).catch(err => logger.error(err));
}

// on-chain fulfill with retry/backoff
async function fulfillOnChainWithRetry(requestId, success) {
  const maxRetries = 4;
  let attempt = 0;
  let lastErr = null;
  while (attempt < maxRetries) {
    try {
      const tx = await verifier.fulfillVerification(requestId, success, { gasLimit: Number(GAS_LIMIT) });
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (err) {
      lastErr = err;
      attempt++;
      const backoff = 1000 * Math.pow(2, attempt); // 2s,4s,...
      logger.warn(`fulfill attempt ${attempt} failed. Retrying in ${backoff}ms. err=${err.message}`);
      await sleep(backoff);
    }
  }
  throw lastErr;
}

// ---------- start up: add some logging and optionally seed admin user if none ----------
function ensureAdminUser() {
  logger.info('Admin user seeding is handled by the trap-authenticator backend.');
}

ensureAdminUser();

// ---------- utility to listen to past events on startup (optional) ----------
(async function catchupPastEvents() {
  // optional: fetch past VerificationRequested events not yet processed
  // For simplicity we don't re-scan chain here; operator can re-sync if needed.
})();

process.on('SIGINT', () => {
  logger.info('Shutting down, waiting for queue to drain...');
  queue.onIdle().then(() => process.exit(0));
});