import { ethers } from 'ethers';

/**
 * Compute the current code for a given trap seed and block number
 * This matches the logic in the DroseraTrap smart contract
 */
export function computeCode(trapSeed: string, blockNumber: number): number {
  const ROTATION_INTERVAL = 5;
  const MAX_CODE = 1_000_000;
  
  // Use block number divided by rotation interval for deterministic rotation
  const rotationKey = Math.floor(blockNumber / ROTATION_INTERVAL);
  
  // Generate deterministic hash from rotation key and trap seed
  const hash = ethers.keccak256(
    ethers.solidityPacked(['uint256', 'uint256'], [rotationKey, trapSeed])
  );
  
  // Convert to 6-digit code
  const code = BigInt(hash) % BigInt(MAX_CODE);
  
  return Number(code);
}

/**
 * Get the next rotation block for a given block number
 */
export function getNextRotationBlock(blockNumber: number): number {
  const ROTATION_INTERVAL = 5;
  return Math.floor(blockNumber / ROTATION_INTERVAL + 1) * ROTATION_INTERVAL;
}

/**
 * Get the current rotation key for a given block number
 */
export function getRotationKey(blockNumber: number): number {
  const ROTATION_INTERVAL = 5;
  return Math.floor(blockNumber / ROTATION_INTERVAL);
}

/**
 * Check if a block number is at a rotation boundary
 */
export function isRotationBlock(blockNumber: number): boolean {
  return blockNumber % 5 === 0;
}