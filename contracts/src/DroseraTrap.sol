// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DroseraTrap
 * @dev A minimal authenticator trap that generates rotating 6-digit codes
 * @notice This contract implements a simple code generation mechanism similar to Google Authenticator
 *         but powered by blockchain state (block number) for deterministic code rotation
 */
contract DroseraTrap {
    // The seed for this specific trap instance
    uint256 public immutable trapSeed;
    
    // Code rotation interval (in blocks)
    uint256 public constant ROTATION_INTERVAL = 5;
    
    // Maximum code value (6 digits)
    uint256 public constant MAX_CODE = 1_000_000;
    
    // Events
    event CodeGenerated(uint256 indexed trapId, uint256 code, uint256 blockNumber);
    
    /**
     * @dev Constructor sets the trap seed
     * @param _trapSeed Unique seed for this trap instance
     */
    constructor(uint256 _trapSeed) {
        trapSeed = _trapSeed;
    }
    
    /**
     * @dev Get the current 6-digit code for this trap
     * @return The current 6-digit code (0-999999)
     * @notice Code rotates every ROTATION_INTERVAL blocks
     */
    function getCurrentCode() public view returns (uint256) {
        return getCurrentCode(trapSeed);
    }
    
    /**
     * @dev Get the current 6-digit code for a specific trap seed
     * @param _trapSeed The seed to generate code for
     * @return The current 6-digit code (0-999999)
     * @notice Code rotates every ROTATION_INTERVAL blocks
     */
    function getCurrentCode(uint256 _trapSeed) public view returns (uint256) {
        // Use block number divided by rotation interval for deterministic rotation
        uint256 rotationKey = block.number / ROTATION_INTERVAL;
        
        // Generate deterministic hash from rotation key and trap seed
        bytes32 hash = keccak256(abi.encodePacked(rotationKey, _trapSeed));
        
        // Convert to 6-digit code
        uint256 code = uint256(hash) % MAX_CODE;
        
        return code;
    }
    
    /**
     * @dev Get the current code with additional metadata
     * @return code The current 6-digit code
     * @return blockNumber The current block number
     * @return nextRotationBlock The block number when code will next rotate
     */
    function getCurrentCodeWithMetadata() public view returns (
        uint256 code,
        uint256 blockNumber,
        uint256 nextRotationBlock
    ) {
        code = getCurrentCode();
        blockNumber = block.number;
        nextRotationBlock = ((blockNumber / ROTATION_INTERVAL) + 1) * ROTATION_INTERVAL;
    }
    
    /**
     * @dev Get the trap ID (address of this contract)
     * @return The trap ID
     */
    function getTrapId() public view returns (address) {
        return address(this);
    }
    
    /**
     * @dev Verify if a given code is valid for the current block
     * @param _code The code to verify
     * @return True if the code is valid for current block
     */
    function verifyCode(uint256 _code) public view returns (bool) {
        return _code == getCurrentCode();
    }
    
    /**
     * @dev Get code for a specific block number (for testing/verification)
     * @param _blockNumber The block number to get code for
     * @return The code for that block
     */
    function getCodeForBlock(uint256 _blockNumber) public view returns (uint256) {
        uint256 rotationKey = _blockNumber / ROTATION_INTERVAL;
        bytes32 hash = keccak256(abi.encodePacked(rotationKey, trapSeed));
        return uint256(hash) % MAX_CODE;
    }
}