const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const CORS_ORIGIN = process.env.CORS_ORIGIN;
app.use(cors(CORS_ORIGIN ? { origin: CORS_ORIGIN } : undefined));
app.use(express.json());
// Simple rate limiter (per-IP, in-memory)
const rateWindowMs = 60_000; // 1 minute
const maxRequestsPerWindow = 60;
const ipToHits = new Map();
app.use((req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    let hits = ipToHits.get(ip);
    if (!hits) {
        hits = [];
        ipToHits.set(ip, hits);
    }
    // purge old
    while (hits.length && now - hits[0] > rateWindowMs) hits.shift();
    hits.push(now);
    if (hits.length > maxRequestsPerWindow) {
        return res.status(429).json({ success: false, error: 'Rate limit exceeded' });
    }
    next();
});

// In-memory caches (persistence handled by file store)
const verificationLogs = [];

// Simple file-based user store with AES-256-GCM encrypted seeds
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const REQUESTS_FILE = path.join(DATA_DIR, 'requests.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, JSON.stringify({}), 'utf-8');
if (!fs.existsSync(REQUESTS_FILE)) fs.writeFileSync(REQUESTS_FILE, JSON.stringify({}), 'utf-8');

function loadUsers() {
    try {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (_) {
        return {};
    }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function loadRequests() {
    try {
        return JSON.parse(fs.readFileSync(REQUESTS_FILE, 'utf-8'));
    } catch (_) {
        return {};
    }
}

function saveRequests(requests) {
    fs.writeFileSync(REQUESTS_FILE, JSON.stringify(requests, null, 2));
}

// AES-256-GCM utilities
const MASTER_KEY_B64 = process.env.MASTER_KEY_B64 || '';
const MASTER_ENC_KEY_HEX = process.env.MASTER_ENC_KEY || '';
function getMasterKey() {
    // Prefer base64 if present
    if (MASTER_KEY_B64) {
        const buf = Buffer.from(MASTER_KEY_B64, 'base64');
        if (buf.length === 32) return buf;
    }
    // Fallback: hex form (MASTER_ENC_KEY)
    if (MASTER_ENC_KEY_HEX) {
        const hex = MASTER_ENC_KEY_HEX.startsWith('0x') ? MASTER_ENC_KEY_HEX.slice(2) : MASTER_ENC_KEY_HEX;
        const buf = Buffer.from(hex, 'hex');
        if (buf.length === 32) return buf;
    }
    return null;
}

function encryptSeed(plain) {
    const key = getMasterKey();
    if (!key) throw new Error('MASTER_KEY_B64 not set or invalid (expect 32-byte base64)');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return {
        ct_b64: ciphertext.toString('base64'),
        iv_b64: iv.toString('base64'),
        tag_b64: tag.toString('base64')
    };
}

function decryptSeed(enc) {
    const key = getMasterKey();
    if (!key) throw new Error('MASTER_KEY_B64 not set or invalid');
    const iv = Buffer.from(enc.iv_b64, 'base64');
    const ct = Buffer.from(enc.ct_b64, 'base64');
    const tag = Buffer.from(enc.tag_b64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(ct), decipher.final()]);
    return plain.toString('utf8');
}

// Verifier contract wiring
const RPC_URL = process.env.RPC_URL;
const VERIFIER_ADDRESS = process.env.VERIFIER_ADDRESS || '0xbee65c3c00926c96d6888faeb13b30e1c3b061fa';
const BACKEND_PRIVATE_KEY = process.env.BACKEND_PRIVATE_KEY || process.env.PRIVATE_KEY || '';

const verifierABI = [
    {
        type: 'function',
        name: 'requestVerification',
        inputs: [
            { name: 'requestId', type: 'bytes32', internalType: 'bytes32' },
            { name: 'userId', type: 'bytes32', internalType: 'bytes32' },
            { name: 'expirySeconds', type: 'uint64', internalType: 'uint64' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        type: 'function',
        name: 'fulfillVerification',
        inputs: [
            { name: 'requestId', type: 'bytes32', internalType: 'bytes32' },
            { name: 'success', type: 'bool', internalType: 'bool' }
        ],
        outputs: [],
        stateMutability: 'nonpayable'
    },
    {
        type: 'event',
        name: 'VerificationRequested',
        inputs: [
            { name: 'requestId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
            { name: 'requester', type: 'address', indexed: true, internalType: 'address' },
            { name: 'userId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
            { name: 'createdAt', type: 'uint64', indexed: false, internalType: 'uint64' },
            { name: 'expiryAt', type: 'uint64', indexed: false, internalType: 'uint64' }
        ],
        anonymous: false
    },
    {
        type: 'event',
        name: 'VerificationFulfilled',
        inputs: [
            { name: 'requestId', type: 'bytes32', indexed: true, internalType: 'bytes32' },
            { name: 'success', type: 'bool', indexed: false, internalType: 'bool' },
            { name: 'oracle', type: 'address', indexed: true, internalType: 'address' },
            { name: 'fulfilledAt', type: 'uint64', indexed: false, internalType: 'uint64' }
        ],
        anonymous: false
    }
];

function getSignerAndContract() {
    if (!RPC_URL) throw new Error('RPC_URL not set');
    if (!BACKEND_PRIVATE_KEY) throw new Error('BACKEND_PRIVATE_KEY not set');
    const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(BACKEND_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(VERIFIER_ADDRESS, verifierABI, wallet);
    return { provider, wallet, contract };
}

// RPC URLs for different chains
const rpcUrls = {
    1: 'https://eth.llamarpc.com',
    5: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    137: 'https://polygon-rpc.com',
    42161: 'https://arb1.arbitrum.io/rpc',
    560048: 'https://rpc.hoodi-testnet.example' // placeholder
};

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

/**
 * Get trap state from contract
 */
async function getTrapState(provider, trapAddress) {
    try {
        // Simple trap contract ABI for shouldRespond function
        const trapABI = [
            "function shouldRespond(bytes[] memory data) public view returns (bool)"
        ];

        const trapContract = new ethers.Contract(trapAddress, trapABI, provider);
        
        // For demo purposes, we'll simulate trap state
        // In a real implementation, you would call the trap contract's shouldRespond function
        const mockData = [ethers.utils.formatBytes32String("mock")];
        const result = await trapContract.shouldRespond(mockData);
        return result;
    } catch (error) {
        console.warn('Failed to check trap state, using mock data:', error);
        // Return mock trap state for demo
        return Math.random() > 0.8; // 20% chance of trap being triggered
    }
}

// Routes

/**
 * Register a new user (server generates seed; stores encrypted)
 */
app.post('/api/register', async (req, res) => {
    try {
        const { userId, trapId, chainId } = req.body;

        if (!userId || !trapId || !chainId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, trapId, chainId'
            });
        }

        const users = loadUsers();
        if (users[userId]) {
            return res.status(409).json({ success: false, error: 'User already registered' });
        }

        // Generate 128-bit random seed (hex)
        const seedBytes = crypto.randomBytes(16);
        const seedHex = seedBytes.toString('hex');
        const encrypted = encryptSeed(seedHex);

        users[userId] = {
            seed: encrypted, // encrypted at rest
            trapId,
            chainId,
            registeredAt: new Date().toISOString()
        };
        saveUsers(users);

        // Build otpauth URI-like string (for demo; real TOTP apps expect base32 + issuer/account)
        const otpauth = `otpauth://totp/TrapAuth:${encodeURIComponent(userId)}?secret=${seedHex}&issuer=TrapAuth&digits=6&period=60`;

        res.json({
            success: true,
            message: 'User registered successfully',
            userId,
            otpauth
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Verify OTP code (decrypts seed, recomputes, compares)
 */
app.post('/api/verify', async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: userId, code'
            });
        }
        // Ensure user exists
        const users = loadUsers();
        if (!users[userId]) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // Create requestId = keccak256(userId, now, random)
        const nowMs = Date.now();
        const nonce = crypto.randomBytes(8).toString('hex');
        const requestId = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'uint64', 'bytes8'],
                [ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userId)), BigInt(nowMs), '0x' + nonce]
            )
        );

        // Persist submitted code for oracle
        const requests = loadRequests();
        requests[requestId] = {
            userId,
            code,
            createdAt: new Date().toISOString()
        };
        saveRequests(requests);

        // Call on-chain requestVerification with expirySeconds policy
        const expirySeconds = parseInt(process.env.EXPIRY_SECONDS || '120', 10);
        const { contract } = getSignerAndContract();
        const userIdBytes32 = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(userId));
        const tx = await contract.requestVerification(requestId, userIdBytes32, expirySeconds);
        const receipt = await tx.wait();

        // Log attempt
        verificationLogs.push({ userId, code, requestId, txHash: receipt.transactionHash, timestamp: new Date().toISOString() });

        res.json({ success: true, requestId, txHash: receipt.transactionHash });

    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Fetch submitted request for oracle (no auth for demo; lock down in prod)
 */
app.get('/api/request/:requestId', (req, res) => {
    try {
        const { requestId } = req.params;
        // Optional HMAC auth
        const sharedKeyHex = process.env.API_HMAC_KEY || '';
        if (sharedKeyHex) {
            try {
                const provided = req.headers['x-signature'];
                if (!provided) return res.status(401).json({ success: false, error: 'Missing signature' });
                const key = Buffer.from(sharedKeyHex.replace(/^0x/, ''), 'hex');
                const mac = crypto.createHmac('sha256', key).update(requestId).digest('hex');
                const ok = crypto.timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(mac, 'hex'));
                if (!ok) return res.status(401).json({ success: false, error: 'Invalid signature' });
            } catch (_) {
                return res.status(401).json({ success: false, error: 'Signature verification failed' });
            }
        }
        const requests = loadRequests();
        const record = requests[requestId];
        if (!record) return res.status(404).json({ success: false, error: 'Not found' });
        res.json({ success: true, request: record });
    } catch (e) {
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Check status of a verification by reading VerificationFulfilled logs
 */
app.get('/api/status/:requestId', async (req, res) => {
    try {
        const { requestId } = req.params;
        const { provider, contract } = getSignerAndContract();
        const iface = new ethers.utils.Interface(verifierABI);
        const eventFrag = iface.getEvent('VerificationFulfilled');
        const topic = iface.getEventTopic(eventFrag);
        const filter = {
            address: VERIFIER_ADDRESS,
            topics: [topic, requestId]
        };
        // Query recent logs (last 10k blocks) — adjust if needed
        const latest = await provider.getBlockNumber();
        const fromBlock = Math.max(0, latest - 10000);
        const logs = await provider.getLogs({ ...filter, fromBlock, toBlock: latest });
        if (!logs.length) return res.json({ success: true, found: false });
        const parsed = logs.map(l => iface.parseLog(l))[0];
        const success = parsed.args.success;
        const oracle = parsed.args.oracle;
        const fulfilledAt = parsed.args.fulfilledAt.toString();
        res.json({ success: true, found: true, result: { success, oracle, fulfilledAt, txHash: logs[0].transactionHash } });
    } catch (e) {
        console.error('status error:', e);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Get verification logs for a user
 */
app.get('/api/logs/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userLogs = verificationLogs.filter(log => log.userId === userId);
        
        res.json({
            success: true,
            logs: userLogs
        });
    } catch (error) {
        console.error('Get logs error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get trap state
 */
app.get('/api/trap-state/:trapId/:chainId', async (req, res) => {
    try {
        const { trapId, chainId } = req.params;
        
        const rpcUrl = rpcUrls[chainId];
        if (!rpcUrl) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported chain ID'
            });
        }

        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const trapTriggered = await getTrapState(provider, trapId);
        const block = await provider.getBlock('latest');

        res.json({
            success: true,
            trapTriggered,
            blockNumber: block.number,
            blockHash: block.hash,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Get trap state error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Drosera Trap Authenticator API is running',
        timestamp: new Date().toISOString(),
        registeredUsers: Object.keys(loadUsers()).length,
        totalVerifications: verificationLogs.length
    });
});

/**
 * Config endpoint
 */
app.get('/api/config', (req, res) => {
    res.json({
        success: true,
        chains: Object.keys(rpcUrls).map(k => ({ chainId: Number(k), rpcUrl: rpcUrls[k] })),
        rateLimit: { windowMs: rateWindowMs, maxRequests: maxRequestsPerWindow }
    });
});

/**
 * Get all registered users (for admin purposes)
 */
app.get('/api/users', (req, res) => {
    try {
        const usersObj = loadUsers();
        const users = Object.entries(usersObj).map(([userId, data]) => ({
            userId,
            trapId: data.trapId,
            chainId: data.chainId,
            registeredAt: data.registeredAt
        }));

        res.json({
            success: true,
            users
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Drosera Trap Authenticator API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📝 API Documentation:`);
    console.log(`   POST /api/register - Register user with seed`);
    console.log(`   POST /api/verify - Verify OTP code`);
    console.log(`   GET  /api/logs/:userId - Get user verification logs`);
    console.log(`   GET  /api/trap-state/:trapId/:chainId - Get trap state`);
    console.log(`   GET  /api/users - Get all registered users`);
});

module.exports = app;




