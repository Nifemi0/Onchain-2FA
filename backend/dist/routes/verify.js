"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCodeEndpoint = void 0;
const ethers_1 = require("ethers");
const codeGenerator_1 = require("../utils/codeGenerator");
const verifyCodeEndpoint = async (req, res) => {
    try {
        const { code, trapId, blockNumber } = req.body;
        // Validate input
        if (!code || !trapId) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Missing required fields: code and trapId are required'
            });
        }
        if (typeof code !== 'number' || code < 0 || code >= 1000000) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Invalid code: must be a number between 0 and 999999'
            });
        }
        if (!ethers_1.ethers.isAddress(trapId)) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Invalid trapId: must be a valid Ethereum address'
            });
        }
        // Get current block number if not provided
        let currentBlockNumber = blockNumber;
        if (!currentBlockNumber) {
            try {
                const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
                currentBlockNumber = await provider.getBlockNumber();
            }
            catch (error) {
                console.error('Error fetching block number:', error);
                return res.status(500).json({
                    success: false,
                    valid: false,
                    message: 'Failed to fetch current block number'
                });
            }
        }
        // Get trap seed from contract
        let trapSeed;
        try {
            const provider = new ethers_1.ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
            const contract = new ethers_1.ethers.Contract(trapId, [
                'function trapSeed() view returns (uint256)'
            ], provider);
            const seed = await contract.trapSeed();
            trapSeed = seed.toString();
        }
        catch (error) {
            console.error('Error fetching trap seed:', error);
            return res.status(500).json({
                success: false,
                valid: false,
                message: 'Failed to fetch trap seed from contract'
            });
        }
        // Compute expected code
        const computedCode = (0, codeGenerator_1.computeCode)(trapSeed, currentBlockNumber);
        const isValid = computedCode === code;
        res.json({
            success: true,
            valid: isValid,
            message: isValid ? 'Code is valid' : 'Code is invalid',
            computedCode,
            blockNumber: currentBlockNumber
        });
    }
    catch (error) {
        console.error('Error in verify endpoint:', error);
        res.status(500).json({
            success: false,
            valid: false,
            message: 'Internal server error during verification'
        });
    }
};
exports.verifyCodeEndpoint = verifyCodeEndpoint;
//# sourceMappingURL=verify.js.map