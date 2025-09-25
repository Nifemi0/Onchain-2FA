/**
 * Drosera Trap Authenticator - Main Application
 * Handles UI interactions, blockchain integration, and OTP generation
 */

class TrapAuthenticator {
    constructor() {
        this.crypto = new CryptoUtils();
        this.provider = null;
        this.trapContract = null;
        this.currentSeed = null;
        this.intervalId = null;
        this.updateInterval = 60; // seconds per requirements
        this.isRunning = false;
        this.apiBase = (window.API_BASE || 'http://localhost:3000').replace(/\/$/, '');
        this.userId = null;
        
        // Default RPC URLs for different chains
        this.rpcUrls = {
            1: 'https://eth.llamarpc.com',
            5: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
            137: 'https://polygon-rpc.com',
            42161: 'https://arb1.arbitrum.io/rpc',
            560048: 'https://rpc.hoodi-testnet.example' // placeholder
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadSettings();
        this.parseURLParams();
        await this.initializeProvider();
        await this.ensureRegistration();
        this.updateUI();
    }

    setupEventListeners() {
        // Advanced settings toggle
        document.getElementById('toggle-advanced').addEventListener('click', () => {
            const panel = document.getElementById('advanced-panel');
            const hidden = panel.classList.contains('hidden');
            panel.classList.toggle('hidden');
            panel.setAttribute('aria-hidden', String(!hidden));
            document.getElementById('toggle-advanced').setAttribute('aria-expanded', String(hidden));
        });
        // Tabs
        document.getElementById('tab-auth').addEventListener('click', () => {
            document.getElementById('auth-tab').classList.remove('hidden');
            document.getElementById('verify-tab').classList.add('hidden');
            document.getElementById('tab-auth').className = 'btn-primary';
            document.getElementById('tab-verify').className = 'btn-secondary';
        });
        document.getElementById('tab-verify').addEventListener('click', () => {
            document.getElementById('auth-tab').classList.add('hidden');
            document.getElementById('verify-tab').classList.remove('hidden');
            document.getElementById('tab-auth').className = 'btn-secondary';
            document.getElementById('tab-verify').className = 'btn-primary';
        });
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Seed generation
        document.getElementById('generate-seed').addEventListener('click', () => {
            this.generateNewSeed();
        });

        // Start authentication
        document.getElementById('start-auth').addEventListener('click', () => {
            this.startAuthentication();
        });
        // Copy code
        document.getElementById('copy-code').addEventListener('click', async () => {
            const code = document.getElementById('otp-display').textContent;
            try {
                await navigator.clipboard.writeText(code);
                this.showSuccess('Code copied to clipboard');
            } catch (e) {
                this.showError('Failed to copy code');
            }
        });

        // Test code
        document.getElementById('test-code').addEventListener('click', () => {
            this.testCode();
        });

        // Export seed
        document.getElementById('export-seed').addEventListener('click', () => {
            this.showQRModal();
        });

        // Modal controls
        document.getElementById('close-qr').addEventListener('click', () => {
            this.hideQRModal();
        });

        document.getElementById('copy-seed').addEventListener('click', () => {
            this.copySeed();
        });

        // Configuration changes
        document.getElementById('trap-id').addEventListener('input', () => {
            this.saveSettings();
        });

        document.getElementById('chain-id').addEventListener('change', () => {
            this.updateRPCUrl();
            this.saveSettings();
        });

        document.getElementById('interval').addEventListener('change', () => {
            this.updateInterval = parseInt(document.getElementById('interval').value);
            this.saveSettings();
        });

        document.getElementById('seed-input').addEventListener('input', () => {
            this.currentSeed = document.getElementById('seed-input').value;
            this.saveSettings();
        });

        // Verify
        document.getElementById('btn-verify').addEventListener('click', () => {
            this.verifyOnChain();
        });

        // Wallet modal controls
        document.getElementById('connect-wallet').addEventListener('click', () => {
            document.getElementById('wallet-modal').classList.remove('hidden');
        });
        document.getElementById('close-wallet-modal').addEventListener('click', () => {
            document.getElementById('wallet-modal').classList.add('hidden');
        });
        // MetaMask
        document.getElementById('btn-mm').addEventListener('click', async () => {
            if (!window.ethereum) return this.showError('MetaMask not found');
            try {
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                this.showConnectedAddress(accounts[0]);
                await this.ensureRegistration();
            } catch (_) { this.showError('Wallet connection rejected'); }
        });
        // Coinbase, Trust, Rainbow (attempt injected providers)
        document.getElementById('btn-coinbase').addEventListener('click', async () => {
            const provider = window.ethereum?.providers?.find(p => p.isCoinbaseWallet) || window.coinbaseWalletExtension;
            if (!provider) return this.showError('Coinbase Wallet not found');
            try { const accounts = await provider.request({ method: 'eth_requestAccounts' }); this.showConnectedAddress(accounts[0]); await this.ensureRegistration(); } catch(_) { this.showError('Connection rejected'); }
        });
        document.getElementById('btn-trust').addEventListener('click', async () => {
            const provider = window.ethereum?.providers?.find(p => p.isTrust) || window.trustwallet;
            if (!provider) return this.showError('Trust Wallet not found');
            try { const accounts = await provider.request({ method: 'eth_requestAccounts' }); this.showConnectedAddress(accounts[0]); await this.ensureRegistration(); } catch(_) { this.showError('Connection rejected'); }
        });
        document.getElementById('btn-rainbow').addEventListener('click', async () => {
            const provider = window.ethereum?.providers?.find(p => p.isRainbow);
            if (!provider) return this.showError('Rainbow not found');
            try { const accounts = await provider.request({ method: 'eth_requestAccounts' }); this.showConnectedAddress(accounts[0]); await this.ensureRegistration(); } catch(_) { this.showError('Connection rejected'); }
        });
        // Rabby
        document.getElementById('btn-rabby').addEventListener('click', async () => {
            const provider = window.ethereum?.providers?.find(p => p.isRabby) || window.rabby;
            if (!provider) return this.showError('Rabby not found');
            try { const accounts = await provider.request({ method: 'eth_requestAccounts' }); this.showConnectedAddress(accounts[0]); await this.ensureRegistration(); } catch(_) { this.showError('Connection rejected'); }
        });
        // WalletConnect v2 (requires projectId)
        document.getElementById('btn-wc').addEventListener('click', async () => {
            try {
                const EthProvider = window.EthereumProvider?.EthereumProvider;
                if (!EthProvider) return this.showError('WalletConnect provider unavailable');
                const wc = await EthProvider.init({
                    projectId: '39bb6115d2fe2562179afc55cd6c4a50',
                    metadata: {
                        name: 'Trap Authenticator',
                        description: 'Drosera Trap Authenticator',
                        url: window.location.origin,
                        icons: []
                    }
                });
                const accounts = await wc.request({ method: 'eth_requestAccounts' });
                this.showConnectedAddress(accounts[0]);
                await this.ensureRegistration();
            } catch (e) {
                this.showError('WalletConnect connection failed');
            }
        });
    }

    // Ensure the user has a backend registration and local userId
    async ensureRegistration() {
        try {
            // load userId from local storage or generate one
            const stored = localStorage.getItem('trap-auth-userId');
            if (stored) {
                this.userId = stored;
                return;
            }
            const newId = 'usr_' + Array.from(crypto.getRandomValues(new Uint8Array(8))).map(b => b.toString(16).padStart(2, '0')).join('');
            this.userId = newId;

            const trapId = document.getElementById('trap-id').value;
            const chainId = parseInt(document.getElementById('chain-id').value);
            if (!trapId || !chainId) return;

            const res = await fetch(`${this.apiBase}/api/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: this.userId, trapId, chainId })
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Registration failed');
            localStorage.setItem('trap-auth-userId', this.userId);
            this.showSuccess('Registered for verification');
            // Optionally, display QR using returned otpauth
            if (data.otpauth) {
                // If a QR modal exists, draw it briefly for user export
                try {
                    const qrContainer = document.getElementById('qr-code');
                    if (qrContainer && window.QRCode) {
                        QRCode.toCanvas(qrContainer, data.otpauth, { width: 200, height: 200 });
                        document.getElementById('qr-modal').classList.remove('hidden');
                    }
                } catch (_) {}
            }
        } catch (e) {
            console.error('ensureRegistration error:', e);
            // silent fail; user can retry later
        }
    }

    async initializeProvider() {
        const chainId = parseInt(document.getElementById('chain-id').value);
        const rpcUrl = document.getElementById('rpc-url').value || this.rpcUrls[chainId];
        
        if (!rpcUrl) {
            this.showError('Please provide an RPC URL for the selected chain');
            return;
        }

        try {
            this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
            // Test connection with timeout and graceful fallback
            const networkPromise = this.provider.getNetwork();
            await Promise.race([
                networkPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('RPC timeout')), 7000))
            ]);
            this.updateChainInfo();
        } catch (error) {
            console.error('Failed to initialize provider:', error);
            this.showError('No RPC connection. Check RPC URL or try again.');
        }
    }

    async updateChainInfo() {
        if (!this.provider) return;

        try {
            const network = await this.provider.getNetwork();
            const blockNumber = await this.provider.getBlockNumber();
            
            document.getElementById('chain-info').textContent = `${network.name} (${network.chainId})`;
            document.getElementById('block-number').textContent = blockNumber.toLocaleString();
            // Footer info
            document.getElementById('footer-chain').textContent = String(network.chainId);
            document.getElementById('footer-trap').textContent = document.getElementById('trap-id').value || '—';
        } catch (error) {
            console.error('Failed to update chain info:', error);
        }
    }

    async generateNewSeed() {
        try {
            const seed = await this.crypto.generateSeed(32);
            this.currentSeed = seed;
            document.getElementById('seed-input').value = seed;
            this.saveSettings();
            this.showSuccess('New seed generated successfully');
        } catch (error) {
            console.error('Failed to generate seed:', error);
            this.showError('Failed to generate new seed');
        }
    }

    async startAuthentication() {
        if (!this.currentSeed) {
            this.showError('Please enter or generate a seed first');
            return;
        }

        if (!this.provider) {
            this.showError('Please configure blockchain connection first');
            return;
        }

        const trapId = document.getElementById('trap-id').value;
        if (!trapId) {
            this.showError('Please enter a trap contract address');
            return;
        }

        try {
            await this.initializeTrapContract(trapId);
            this.isRunning = true;
            this.startOTPGeneration();
            this.showSuccess('Authentication started successfully');
        } catch (error) {
            console.error('Failed to start authentication:', error);
            this.showError('Failed to start authentication: ' + error.message);
        }
    }

    async initializeTrapContract(trapAddress) {
        // Simple trap contract ABI for shouldRespond function
        // ABI for reading current code (adjust if contract differs)
        const trapABI = [
            "function getCurrentCode(uint256 trapSeed) view returns (uint256)",
            "function shouldRespond(bytes[] memory data) view returns (bool)"
        ];

        this.trapContract = new ethers.Contract(trapAddress, trapABI, this.provider);
    }

    async startOTPGeneration() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }

        // Generate initial OTP
        await this.generateOTP();

        // Set up interval for updates
        this.intervalId = setInterval(async () => {
            await this.generateOTP();
        }, this.updateInterval * 1000);
    }

    async generateOTP() {
        if (!this.isRunning || !this.provider || !this.trapContract) return;

        try {
            // Prefer on-chain code from trap if available
            let otp;
            try {
                const seedInt = ethers.BigNumber.from('0x' + (this.currentSeed || '0'));
                const code = await this.trapContract.getCurrentCode(seedInt);
                otp = code.toString().padStart(6, '0').slice(-6);
            } catch (e) {
                // Fallback: client-derived OTP
                const block = await this.provider.getBlock('latest');
                const trapTriggered = await this.checkTrapState();
                otp = await this.crypto.generateTrapOTP(
                    this.currentSeed,
                    block.hash,
                    trapTriggered,
                    6
                );
                this.updateBlockInfo(block.number);
            }

            // Update UI
            this.updateOTPDisplay(otp);
            this.updateTimer();
            // footer updated in updateChainInfo

        } catch (error) {
            console.error('Failed to generate OTP:', error);
            this.showError('Failed to generate OTP: ' + error.message);
        }
    }

    async verifyOnChain() {
        const trapId = document.getElementById('trap-id').value;
        const userCode = (document.getElementById('verify-code').value || '').trim();
        const resultEl = document.getElementById('verify-result');
        const metaEl = document.getElementById('verify-meta');
        resultEl.className = 'test-status';
        metaEl.textContent = '';
        if (!this.provider || !trapId) {
            this.showError('Configure chain and trap first');
            return;
        }
        try {
            await this.initializeTrapContract(trapId);
            const seedInt = ethers.BigNumber.from('0x' + (this.currentSeed || '0'));
            // current window
            const currentCode = (await this.trapContract.getCurrentCode(seedInt)).toString().padStart(6, '0').slice(-6);
            const block = await this.provider.getBlock('latest');
            const isValid = userCode === currentCode;
            if (isValid) {
                resultEl.className = 'test-status success';
                resultEl.textContent = '✓ Valid code';
                metaEl.textContent = `Block ${block.number.toLocaleString()} • Window: Current`;
            } else {
                resultEl.className = 'test-status error';
                resultEl.textContent = '✗ Code not valid';
            }
        } catch (e) {
            console.error(e);
            this.showError('Verification failed');
        }
    }
    }

    async checkTrapState() {
        try {
            // For demo purposes, we'll simulate trap state
            // In a real implementation, you would call the trap contract's shouldRespond function
            const mockData = [ethers.utils.formatBytes32String("mock")];
            const result = await this.trapContract.shouldRespond(mockData);
            return result;
        } catch (error) {
            console.warn('Failed to check trap state, using mock data:', error);
            // Return mock trap state for demo
            return Math.random() > 0.8; // 20% chance of trap being triggered
        }
    }

    updateOTPDisplay(code) {
        document.getElementById('otp-display').textContent = code;
    }

    updateTrapStatus(triggered) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        if (triggered) {
            statusDot.className = 'status-dot triggered';
            statusText.textContent = 'TRIGGERED';
        } else {
            statusDot.className = 'status-dot active';
            statusText.textContent = 'SAFE';
        }
    }

    updateTimer() {
        const progressBar = document.getElementById('timer-progress');
        const timerText = document.getElementById('timer-text');
        
        let timeLeft = this.updateInterval;
        timerText.textContent = `${timeLeft}s`;
        
        const timerInterval = setInterval(() => {
            timeLeft--;
            const progress = ((this.updateInterval - timeLeft) / this.updateInterval) * 100;
            progressBar.style.width = `${progress}%`;
            timerText.textContent = `${timeLeft}s`;
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
            }
        }, 1000);
    }

    updateBlockInfo(blockNumber) {
        document.getElementById('block-number').textContent = blockNumber.toLocaleString();
    }

    async testCode() {
        if (!this.isRunning) {
            this.showError('Please start authentication first');
            return;
        }

        const currentCode = document.getElementById('otp-display').textContent;
        
        try {
            // Get current blockchain data
            const block = await this.provider.getBlock('latest');
            const trapTriggered = await this.checkTrapState();

            // Validate the code
            const isValid = await this.crypto.validateTrapOTP(
                currentCode,
                this.currentSeed,
                block.hash,
                trapTriggered,
                6
            );

            this.showTestResult(isValid);
        } catch (error) {
            console.error('Failed to test code:', error);
            this.showError('Failed to test code: ' + error.message);
        }
    }

    showTestResult(isValid) {
        const testResults = document.getElementById('test-results');
        const testStatus = document.getElementById('test-status');
        
        testResults.classList.remove('hidden');
        
        if (isValid) {
            testStatus.className = 'test-status success';
            testStatus.textContent = '✓ Code is valid and authentic';
        } else {
            testStatus.className = 'test-status error';
            testStatus.textContent = '✗ Code is invalid or expired';
        }

        // Hide result after 5 seconds
        setTimeout(() => {
            testResults.classList.add('hidden');
        }, 5000);
    }

    showQRModal() {
        if (!this.currentSeed) {
            this.showError('Please generate or enter a seed first');
            return;
        }

        const qrData = this.crypto.generateQRData(this.currentSeed);
        const qrContainer = document.getElementById('qr-code');
        const seedDisplay = document.getElementById('seed-display');

        // Generate QR code
        QRCode.toCanvas(qrContainer, qrData, {
            width: 200,
            height: 200,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        }, (error) => {
            if (error) {
                console.error('Failed to generate QR code:', error);
                this.showError('Failed to generate QR code');
            }
        });

        seedDisplay.value = this.currentSeed;
        document.getElementById('qr-modal').classList.remove('hidden');
    }

    hideQRModal() {
        document.getElementById('qr-modal').classList.add('hidden');
    }

    async copySeed() {
        const seedDisplay = document.getElementById('seed-display');
        try {
            await navigator.clipboard.writeText(seedDisplay.value);
            this.showSuccess('Seed copied to clipboard');
        } catch (error) {
            console.error('Failed to copy seed:', error);
            this.showError('Failed to copy seed to clipboard');
        }
    }

    parseURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const trapId = urlParams.get('trapId');
        const chainId = urlParams.get('chainId');

        if (trapId) {
            document.getElementById('trap-id').value = trapId;
        }

        if (chainId) {
            document.getElementById('chain-id').value = chainId;
            this.updateRPCUrl();
        }
    }

    updateRPCUrl() {
        const chainId = parseInt(document.getElementById('chain-id').value);
        const rpcUrl = this.rpcUrls[chainId];
        if (rpcUrl) {
            document.getElementById('rpc-url').value = rpcUrl;
        }
    }

    saveSettings() {
        const settings = {
            seed: this.currentSeed,
            trapId: document.getElementById('trap-id').value,
            chainId: document.getElementById('chain-id').value,
            rpcUrl: document.getElementById('rpc-url').value,
            interval: this.updateInterval
        };

        localStorage.setItem('drosera-trap-auth-settings', JSON.stringify(settings));
    }

    loadSettings() {
        const settings = localStorage.getItem('drosera-trap-auth-settings');
        if (settings) {
            const parsed = JSON.parse(settings);
            
            if (parsed.seed) {
                this.currentSeed = parsed.seed;
                document.getElementById('seed-input').value = parsed.seed;
            }
            
            if (parsed.trapId) {
                document.getElementById('trap-id').value = parsed.trapId;
            }
            
            if (parsed.chainId) {
                document.getElementById('chain-id').value = parsed.chainId;
            }
            
            if (parsed.rpcUrl) {
                document.getElementById('rpc-url').value = parsed.rpcUrl;
            }
            
            if (parsed.interval) {
                this.updateInterval = parsed.interval;
                document.getElementById('interval').value = parsed.interval;
            }
        }
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('drosera-theme', newTheme);
    }

    updateUI() {
        // Load saved theme
        const savedTheme = localStorage.getItem('drosera-theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }

        // Update RPC URL based on selected chain
        this.updateRPCUrl();
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showConnectedAddress(addr) {
        const short = addr.slice(0, 6) + '…' + addr.slice(-4);
        const badge = document.getElementById('wallet-address');
        badge.textContent = short;
        badge.style.display = 'inline';
        document.getElementById('connect-wallet').style.display = 'none';
        document.getElementById('wallet-modal').classList.add('hidden');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            max-width: 400px;
        `;

        if (type === 'success') {
            notification.style.backgroundColor = '#10b981';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#ef4444';
        }

        document.body.appendChild(notification);

        // Remove notification after 5 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.trapAuth = new TrapAuthenticator();
});

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);




