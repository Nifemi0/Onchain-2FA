/**
 * Cryptographic utilities for OTP generation
 * Uses Web Crypto API for secure operations
 */

class CryptoUtils {
    constructor() {
        this.algorithm = 'SHA-256';
    }

    /**
     * Generate a random seed phrase
     * @param {number} length - Length of the seed in bytes
     * @returns {Promise<string>} Hex-encoded seed
     */
    async generateSeed(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Convert string to ArrayBuffer
     * @param {string} str - String to convert
     * @returns {ArrayBuffer}
     */
    stringToArrayBuffer(str) {
        const encoder = new TextEncoder();
        return encoder.encode(str);
    }

    /**
     * Convert ArrayBuffer to hex string
     * @param {ArrayBuffer} buffer - Buffer to convert
     * @returns {string} Hex string
     */
    arrayBufferToHex(buffer) {
        const byteArray = new Uint8Array(buffer);
        return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Hash data using SHA-256
     * @param {string} data - Data to hash
     * @returns {Promise<string>} Hex-encoded hash
     */
    async hash(data) {
        const dataBuffer = this.stringToArrayBuffer(data);
        const hashBuffer = await crypto.subtle.digest(this.algorithm, dataBuffer);
        return this.arrayBufferToHex(hashBuffer);
    }

    /**
     * Generate HMAC using SHA-256
     * @param {string} key - HMAC key
     * @param {string} data - Data to authenticate
     * @returns {Promise<string>} Hex-encoded HMAC
     */
    async hmac(key, data) {
        const keyBuffer = this.stringToArrayBuffer(key);
        const dataBuffer = this.stringToArrayBuffer(data);
        
        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
        return this.arrayBufferToHex(signature);
    }

    /**
     * Generate TOTP-like code
     * @param {string} secret - Secret key
     * @param {number} timeStep - Time step in seconds
     * @param {number} digits - Number of digits in the code
     * @returns {Promise<string>} Generated code
     */
    async generateTOTP(secret, timeStep = 30, digits = 6) {
        const time = Math.floor(Date.now() / 1000 / timeStep);
        const timeHex = time.toString(16).padStart(16, '0');
        
        const hmac = await this.hmac(secret, timeHex);
        const offset = parseInt(hmac.slice(-1), 16);
        const code = parseInt(hmac.substr(offset * 2, 8), 16);
        
        return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
    }

    /**
     * Generate trap-aware OTP
     * @param {string} seed - User seed
     * @param {string} blockHash - Latest block hash
     * @param {boolean} trapTriggered - Trap state
     * @param {number} digits - Number of digits
     * @returns {Promise<string>} Generated OTP code
     */
    async generateTrapOTP(seed, blockHash, trapTriggered, digits = 6) {
        // Combine all factors
        const trapState = trapTriggered ? 'TRIGGERED' : 'SAFE';
        const timeStep = Math.floor(Date.now() / 1000 / 30); // 30-second intervals
        
        const combinedData = `${seed}:${blockHash}:${trapState}:${timeStep}`;
        
        // Generate HMAC
        const hmac = await this.hmac(seed, combinedData);
        
        // Extract code from HMAC
        const offset = parseInt(hmac.slice(-1), 16);
        const code = parseInt(hmac.substr(offset * 2, 8), 16);
        
        return (code % Math.pow(10, digits)).toString().padStart(digits, '0');
    }

    /**
     * Validate OTP code
     * @param {string} code - Code to validate
     * @param {string} seed - User seed
     * @param {string} blockHash - Block hash used
     * @param {boolean} trapTriggered - Trap state used
     * @param {number} digits - Expected number of digits
     * @returns {Promise<boolean>} Whether code is valid
     */
    async validateTrapOTP(code, seed, blockHash, trapTriggered, digits = 6) {
        const expectedCode = await this.generateTrapOTP(seed, blockHash, trapTriggered, digits);
        return code === expectedCode;
    }

    /**
     * Generate QR code data for seed backup
     * @param {string} seed - Seed to encode
     * @returns {string} QR code data
     */
    generateQRData(seed) {
        const data = {
            type: 'drosera-trap-seed',
            version: '1.0',
            seed: seed,
            timestamp: Date.now(),
            description: 'Drosera Trap Authenticator Seed'
        };
        return JSON.stringify(data);
    }

    /**
     * Parse QR code data
     * @param {string} qrData - QR code data
     * @returns {Object|null} Parsed data or null if invalid
     */
    parseQRData(qrData) {
        try {
            const data = JSON.parse(qrData);
            if (data.type === 'drosera-trap-seed' && data.seed) {
                return data;
            }
        } catch (e) {
            console.error('Invalid QR data:', e);
        }
        return null;
    }

    /**
     * Encrypt seed for storage (simple base64 encoding for demo)
     * In production, use proper encryption
     * @param {string} seed - Seed to encrypt
     * @param {string} password - Password for encryption
     * @returns {string} Encrypted seed
     */
    encryptSeed(seed, password) {
        // Simple XOR encryption for demo purposes
        // In production, use proper encryption like AES
        const seedBytes = this.stringToArrayBuffer(seed);
        const passwordBytes = this.stringToArrayBuffer(password);
        
        const encrypted = new Uint8Array(seedBytes.length);
        for (let i = 0; i < seedBytes.length; i++) {
            encrypted[i] = seedBytes[i] ^ passwordBytes[i % passwordBytes.length];
        }
        
        return btoa(String.fromCharCode(...encrypted));
    }

    /**
     * Decrypt seed from storage
     * @param {string} encryptedSeed - Encrypted seed
     * @param {string} password - Password for decryption
     * @returns {string} Decrypted seed
     */
    decryptSeed(encryptedSeed, password) {
        try {
            const encryptedBytes = new Uint8Array(
                atob(encryptedSeed).split('').map(c => c.charCodeAt(0))
            );
            const passwordBytes = this.stringToArrayBuffer(password);
            
            const decrypted = new Uint8Array(encryptedBytes.length);
            for (let i = 0; i < encryptedBytes.length; i++) {
                decrypted[i] = encryptedBytes[i] ^ passwordBytes[i % passwordBytes.length];
            }
            
            return Array.from(decrypted, byte => byte.toString(16).padStart(2, '0')).join('');
        } catch (e) {
            console.error('Failed to decrypt seed:', e);
            return null;
        }
    }
}

// Export for use in other modules
window.CryptoUtils = CryptoUtils;




