const { expect } = require('chai');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const axios = require('axios');
const { ethers } = require('ethers');
require('dotenv').config();

const ORACLE_DIR = path.join(__dirname, 'oracle');
const BACKEND_DIR = path.join(__dirname, 'onchain-2fa-repo', 'trap-authenticator', 'backend');
const FRONTEND_DIR = path.join(__dirname, 'onchain-2fa-repo', 'trap-authenticator', 'frontend');

const ORACLE_PORT = process.env.ORACLE_PORT || 4430;
const BACKEND_PORT = process.env.BACKEND_PORT || 3001;
const FRONTEND_PORT = process.env.FRONTEND_PORT || 3000;

const ORACLE_BASE_URL = `http://localhost:${ORACLE_PORT}`;
const BACKEND_BASE_URL = `http://localhost:${BACKEND_PORT}`;
const FRONTEND_BASE_URL = `http://localhost:${FRONTEND_PORT}`;

let browser;
let page;
let oracleProcess;
let backendProcess;
let frontendProcess;

// Helper to generate trap-aware OTP (copied from frontend/crypto-utils.js)
function generateTrapOTP(seed, blockHash, trapTriggered, digits = 6) {
    const trapState = trapTriggered ? 'TRIGGERED' : 'SAFE';
    const timeStep = Math.floor(Date.now() / 1000 / 30); // 30-second intervals
    
    const combinedData = `${seed}:${blockHash}:${trapState}:${timeStep}`;
    
    // Generate HMAC using Node.js crypto
    const hmac = require('crypto').createHmac('sha256', seed).update(combinedData).digest('hex');
    
    // Extract code from HMAC
    const offset = parseInt(hmac.slice(-1), 16);
    const code = parseInt(hmac.substr(offset * 2, 8), 16);
    
    return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
}

describe('Full Integration Test', () => {
    before(async function() {
        this.timeout(60000); // Increase timeout for setup

        // 1. Start Oracle
        console.log('Starting Oracle...');
        oracleProcess = spawn('node', ['index.js'], { cwd: ORACLE_DIR, detached: true, stdio: 'inherit' });
        oracleProcess.unref();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give oracle time to start
        // Check oracle health
        await axios.get(`${ORACLE_BASE_URL}/health`);
        console.log('Oracle started.');

        // 2. Start Backend
        console.log('Starting Backend...');
        backendProcess = spawn('npm', ['start'], { cwd: BACKEND_DIR, detached: true, stdio: 'inherit' });
        backendProcess.unref();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give backend time to start
        // Check backend health
        await axios.get(`${BACKEND_BASE_URL}/api/health`);
        console.log('Backend started.');

        // 3. Start Frontend
        console.log('Starting Frontend...');
        frontendProcess = spawn('node', ['frontend-server.js'], { cwd: FRONTEND_DIR, detached: true, stdio: 'inherit', env: { ...process.env, FRONTEND_PORT: FRONTEND_PORT } });
        frontendProcess.unref();
        await new Promise(resolve => setTimeout(resolve, 5000)); // Give frontend time to start
        console.log('Frontend started.');

        // 4. Initialize Puppeteer
        browser = await puppeteer.launch({ headless: true, args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ] });
        page = await browser.newPage();



        // Listen for console messages from the page
        page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));
        // Listen for 404 errors
        page.on('response', response => {
            if (response.status() === 404) {
                console.error(`404 Error: ${response.url()}`);
            }
        });

        await page.goto(FRONTEND_BASE_URL, { waitUntil: 'networkidle0' });
        console.log('Puppeteer initialized and navigated to frontend.');
    });

    after(async () => {
        console.log('Cleaning up...');
        if (browser) await browser.close();
        if (oracleProcess) process.kill(-oracleProcess.pid); // Kill process group
        if (backendProcess) process.kill(-backendProcess.pid);
        if (frontendProcess) process.kill(-frontendProcess.pid);
        console.log('Cleanup complete.');
    });

    it('should load the frontend and display key elements', async () => {
        const title = await page.title();
        expect(title).to.equal('Drosera Trap Authenticator');
        const header = await page.$('.header-title');
        expect(header).to.exist;
        const headerText = await page.evaluate(el => el.textContent, header);
        expect(headerText).to.include('Trap-Driven Authentication');
    });

    it('should register a user and display OTP', async function() {
        this.timeout(60000); // Increased timeout for registration and OTP generation

        console.log('Test: Registering user - Filling Trap ID and Chain ID...');
        // Fill in Trap ID and Chain ID
        await page.type('#trap-id', '0xBEe65c3c00926c96d6888FaEB13b3b061fa');
        await page.select('#chain-id', '560048');

        console.log('Test: Registering user - Waiting for window.trapAuth...');
        await page.waitForFunction(() => window.trapAuth !== undefined);
        console.log('Test: Registering user - Calling ensureRegistration...');
        await page.evaluate(async () => {
            console.log('Browser: ensureRegistration started.');
            await window.trapAuth.ensureRegistration();
            console.log('Browser: ensureRegistration completed.');
        });
        console.log('Test: Registering user - ensureRegistration call completed in test.');

        console.log('Test: Registering user - Waiting for generate-seed button...');
        // Wait for the generate-seed button to be visible and enabled
        await page.waitForSelector('#generate-seed:not([disabled])', { visible: true });
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

        console.log('Test: Registering user - Clicking Generate Seed...');
        // Click Generate Seed and Start Authentication
        await page.click('#generate-seed');
        console.log('Test: Registering user - Clicking Start Authentication...');
        await page.click('#start-auth'); // <--- This click triggers ensureRegistration()

        console.log('Test: Registering user - Waiting for OTP display...');
        // Wait for registration to complete and OTP to appear
        await page.waitForSelector('#otp-display', { visible: true, timeout: 20000 }); // Increased timeout for selector
        const otp = await page.evaluate(el => el.textContent, await page.$('#otp-display'));
        expect(otp).to.match(/^\d{6}$/); // Expect a 6-digit OTP
        console.log(`Test: Registered user and OTP displayed: ${otp}`);

        console.log('Test: Registering user - Verifying user registration via backend API...');
        // Verify user registration via backend API (optional, but good for E2E)
        const users = await axios.get(`${BACKEND_BASE_URL}/api/users`);
        expect(users.data.users).to.have.lengthOf.at.least(1);
        expect(users.data.users[0].userId).to.exist;
        console.log('Test: User registration verified via backend API.');
    });

    it('should successfully verify an OTP on-chain', async function() {
        this.timeout(45000); // Increased timeout for on-chain verification

        // Get the current OTP from the display
        const displayedOtp = await page.evaluate(el => el.textContent, await page.$('#otp-display'));
        expect(displayedOtp).to.match(/^\d{6}$/);

        // Switch to Verify tab
        await page.click('#tab-verify');
        await page.waitForSelector('#verify-tab:not(.hidden)');

        // Enter the OTP
        await page.type('#verify-code', displayedOtp);

        // Click Verify button
        await page.click('#btn-verify');

        // Wait for verification result
        await page.waitForSelector('#verify-result.success', { timeout: 30000 });
        const resultText = await page.evaluate(el => el.textContent, await page.$('#verify-result'));
        expect(resultText).to.include('✓ Valid code');
    });

    // Add more tests for other functionalities (e.g., advanced settings, theme toggle, wallet connect)
});
