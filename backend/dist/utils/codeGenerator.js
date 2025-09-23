"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeCode = computeCode;
exports.getNextRotationBlock = getNextRotationBlock;
exports.getRotationKey = getRotationKey;
exports.isRotationBlock = isRotationBlock;
const ethers_1 = require("ethers");
/**
 * Compute the current code for a given trap seed and block number
 * This matches the logic in the DroseraTrap smart contract
 */
function computeCode(trapSeed, blockNumber) {
    const ROTATION_INTERVAL = 5;
    const MAX_CODE = 1000000;
    // Use block number divided by rotation interval for deterministic rotation
    const rotationKey = Math.floor(blockNumber / ROTATION_INTERVAL);
    // Generate deterministic hash from rotation key and trap seed
    const hash = ethers_1.ethers.keccak256(ethers_1.ethers.solidityPacked(['uint256', 'uint256'], [rotationKey, trapSeed]));
    // Convert to 6-digit code
    const code = BigInt(hash) % BigInt(MAX_CODE);
    return Number(code);
}
/**
 * Get the next rotation block for a given block number
 */
function getNextRotationBlock(blockNumber) {
    const ROTATION_INTERVAL = 5;
    return Math.floor(blockNumber / ROTATION_INTERVAL + 1) * ROTATION_INTERVAL;
}
/**
 * Get the current rotation key for a given block number
 */
function getRotationKey(blockNumber) {
    const ROTATION_INTERVAL = 5;
    return Math.floor(blockNumber / ROTATION_INTERVAL);
}
/**
 * Check if a block number is at a rotation boundary
 */
function isRotationBlock(blockNumber) {
    return blockNumber % 5 === 0;
}
//# sourceMappingURL=codeGenerator.js.map