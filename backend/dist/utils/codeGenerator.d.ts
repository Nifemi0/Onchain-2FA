/**
 * Compute the current code for a given trap seed and block number
 * This matches the logic in the DroseraTrap smart contract
 */
export declare function computeCode(trapSeed: string, blockNumber: number): number;
/**
 * Get the next rotation block for a given block number
 */
export declare function getNextRotationBlock(blockNumber: number): number;
/**
 * Get the current rotation key for a given block number
 */
export declare function getRotationKey(blockNumber: number): number;
/**
 * Check if a block number is at a rotation boundary
 */
export declare function isRotationBlock(blockNumber: number): boolean;
//# sourceMappingURL=codeGenerator.d.ts.map