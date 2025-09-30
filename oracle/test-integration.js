
const crypto = require('crypto');
const axios = require('axios');
const ethers = require('ethers');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
require('dotenv').config();

// --- Config ---
const {
    PROVIDER_URL,
    ORACLE_PRIVATE_KEY,
    VERIFIER_CONTRACT_ADDRESS,
    VERIFIER_ABI_PATH,
    API_HMAC_KEY,
    PORT
} = process.env;

const ORACLE_BASE_URL = `http://localhost:${PORT}`;
const TEST_USER_ID = 'test-user-integration';
const TEST_USER_SEED = 'JBSWY3DPEHPK3PXP'; // Base32 encoded seed

// --- Ethers Setup ---
const provider = new ethers.JsonRpcProvider(PROVIDER_URL, new ethers.Network("homestead", 560048));
const wallet = new ethers.Wallet(ORACLE_PRIVATE_KEY, provider);
const verifierAbi = JSON.parse(fs.readFileSync(VERIFIER_ABI_PATH, 'utf8'));
const verifierContract = new ethers.Contract(VERIFIER_CONTRACT_ADDRESS, verifierAbi, wallet);

const ORACLE_ADDRESS = "0x249e79De269e54a901A3d2Ce660496563103b470"; // Replace with your oracle's actual address

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

// --- Helper Functions ---
function generateHmacSignature(body, key) {
    const hmac = crypto.createHmac('sha256', Buffer.from(key, 'hex'));
    hmac.update(JSON.stringify(body));
    return hmac.digest('hex');
}

async function allowOracleOnContract(oracleAddress) {
    console.log(`Allowing oracle ${oracleAddress} on the Verifier contract...`);
    const tx = await verifierContract.allowOracle(oracleAddress);
    await tx.wait();
    console.log('Oracle allowed successfully.');
}

async function addUser(userId, seed) {
    console.log(`Adding user ${userId} to the oracle...`);
    const body = { userId, seed };
    const signature = generateHmacSignature(body, API_HMAC_KEY);
    try {
        await axios.post(`${ORACLE_BASE_URL}/admin/add-user`, body, {
            headers: { 'x-hmac-signature': `sha256=${signature}` }
        });
        console.log('User added successfully.');
    } catch (error) {
        console.error('Error adding user:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function requestVerification(userId, requestId, expirySeconds) {
    console.log(`Requesting verification for ${userId} on-chain...`);
    const tx = await verifierContract.requestVerification(requestId, ethers.encodeBytes32String(userId), expirySeconds);
    const receipt = await tx.wait();
    const event = receipt.logs.find(log => log.fragment && log.fragment.name === 'VerificationRequested');
    if (!event) {
        throw new Error('VerificationRequested event not found');
    }
    const returnedRequestId = event.args[0];
    console.log(`Verification requested. Request ID: ${returnedRequestId}`);
    return returnedRequestId;
}

async function submitCode(requestId, userId, code) {
    console.log(`Submitting code for request ${requestId} to the oracle...`);
    const body = { requestId, userId, code };
    const signature = generateHmacSignature(body, API_HMAC_KEY);
    try {
        await axios.post(`${ORACLE_BASE_URL}/submit-code`, body, {
            headers: { 'x-hmac-signature': `sha256=${signature}` }
        });
        console.log('Code submitted successfully.');
    } catch (error) {
        console.error('Error submitting code:', error.response ? error.response.data : error.message);
        throw error;
    }
}

let oracleProcess;
const ORACLE_LOG_FILE = 'oracle_test_output.log';

async function startOracle() {
    console.log('Starting oracle server...');
    // Clear previous log file
    fs.writeFileSync(ORACLE_LOG_FILE, '');
    const logStream = fs.createWriteStream(ORACLE_LOG_FILE, { flags: 'a' });

    oracleProcess = spawn('node', ['index.js'], {
        cwd: __dirname, // Run in the current directory (oracle folder)
        detached: true, // Detach the child process
        stdio: ['ignore', fs.openSync(ORACLE_LOG_FILE, 'a'), fs.openSync(ORACLE_LOG_FILE, 'a')] // Redirect stdout and stderr to log file
    });

    oracleProcess.unref(); // Allow the parent to exit independently

    // Wait for the oracle to start up and listen on its port
    let attempts = 0;
    const maxAttempts = 40; // Increased from 20
    const delay = 1000; // Increased from 500ms

            while (attempts < maxAttempts) {
                try {
                    await axios.get(`${ORACLE_BASE_URL}/health`);
                    console.log('Oracle server is up and running.');
                    return;
                } catch (error) {
                    attempts++;
                    console.log(`Attempt ${attempts}/${maxAttempts}: Oracle health check failed. Error: ${error.message}`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
            throw new Error('Oracle server failed to start within the allotted time.');}

function stopOracle() {
    if (oracleProcess) {
        console.log('Stopping oracle server...');
        process.kill(-oracleProcess.pid); // Kill the process group
        oracleProcess = null;
        console.log('Oracle server stopped.');
    }
}

// Ensure oracle is stopped on exit
process.on('exit', stopOracle);
process.on('SIGINT', stopOracle);
process.on('SIGTERM', stopOracle);
process.on('uncaughtException', stopOracle);

// --- Test Runner ---
async function runTest() {
    console.log('--- Starting Integration Test ---');
    let testPassed = false;

    try {
        await startOracle();

        // Ensure oracle is allowed on the Verifier contract
        await allowOracleOnContract(ORACLE_ADDRESS);

        // 1. Add user to oracle
        await addUser(TEST_USER_ID, TEST_USER_SEED);

        // 2. Request verification on-chain
        const requestId = ethers.hexlify(ethers.randomBytes(32));
        const returnedRequestId = await requestVerification(TEST_USER_ID, requestId, 60);
        if (requestId !== returnedRequestId) {
            throw new Error(`Request ID mismatch: expected ${requestId}, got ${returnedRequestId}`);
        }

        // Add a small delay to allow the oracle to pick up the VerificationRequested event
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 3. Generate TOTP code
        const blockHash = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Placeholder
        const trapTriggered = false; // Placeholder
        const code = generateTrapOTP(TEST_USER_SEED, blockHash, trapTriggered);
        console.log(`Generated TOTP code: ${code}`);

        // 4. Listen for fulfillment
        console.log('Listening for VerificationFulfilled event...');
        const fulfillmentPromise = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Test failed: Timeout waiting for VerificationFulfilled event'));
            }, 30000); // 30 second timeout

            verifierContract.once('VerificationFulfilled', (reqId, success, message) => {
                if (reqId === requestId) {
                    clearTimeout(timeout);
                    if (success) {
                        console.log(`Verification fulfilled successfully: ${message}`);
                        resolve();
                    } else {
                        reject(new Error(`Test failed: Verification failed with message: ${message}`));
                    }
                }
            });
        });

        // 5. Submit code to oracle
        await submitCode(requestId, TEST_USER_ID, code);

        // 6. Wait for fulfillment
        await fulfillmentPromise;

        console.log('--- Integration Test Passed! ---');
        testPassed = true;
    } catch (error) {
        console.error('--- Integration Test Failed ---');
        console.error(error.message);
    } finally {
        stopOracle();
        if (!testPassed) {
            console.error('--- Oracle Server Logs ---');
            try {
                const logs = fs.readFileSync(ORACLE_LOG_FILE, 'utf8');
                console.error(logs);
            } catch (logError) {
                console.error('Could not read oracle logs:', logError.message);
            }
        }
        process.exit(testPassed ? 0 : 1);
    }
}

runTest();
