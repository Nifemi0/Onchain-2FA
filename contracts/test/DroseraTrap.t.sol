// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console} from "forge-std/Test.sol";
import {DroseraTrap} from "../src/DroseraTrap.sol";

contract DroseraTrapTest is Test {
    DroseraTrap public trap;
    uint256 public constant TEST_SEED = 12345;
    
    function setUp() public {
        trap = new DroseraTrap(TEST_SEED);
    }
    
    function testTrapInitialization() public {
        assertEq(trap.trapSeed(), TEST_SEED);
        assertEq(trap.ROTATION_INTERVAL(), 5);
        assertEq(trap.MAX_CODE(), 1_000_000);
    }
    
    function testGetCurrentCode() public {
        uint256 code = trap.getCurrentCode();
        assertTrue(code < 1_000_000, "Code should be less than 1,000,000");
        assertTrue(code >= 0, "Code should be non-negative");
    }
    
    function testCodeDeterministic() public {
        uint256 code1 = trap.getCurrentCode();
        uint256 code2 = trap.getCurrentCode();
        assertEq(code1, code2, "Code should be deterministic within same block");
    }
    
    function testCodeRotation() public {
        uint256 initialCode = trap.getCurrentCode();
        
        // Advance blocks to trigger rotation
        vm.roll(block.number + 5);
        
        uint256 newCode = trap.getCurrentCode();
        
        // Code should be different after rotation interval
        assertTrue(initialCode != newCode, "Code should change after rotation interval");
    }
    
    function testCodeRotationInterval() public {
        // Start from a block that's aligned with rotation interval
        uint256 alignedBlock = (block.number / 5) * 5;
        vm.roll(alignedBlock);
        
        uint256 code1 = trap.getCurrentCode();
        
        // Advance by 4 blocks (should not rotate)
        vm.roll(alignedBlock + 4);
        uint256 code2 = trap.getCurrentCode();
        assertEq(code1, code2, "Code should not change before rotation interval");
        
        // Advance by 1 more block (should rotate)
        vm.roll(alignedBlock + 5);
        uint256 code3 = trap.getCurrentCode();
        assertTrue(code1 != code3, "Code should change at rotation interval");
    }
    
    function testGetCurrentCodeWithMetadata() public {
        (uint256 code, uint256 blockNumber, uint256 nextRotationBlock) = trap.getCurrentCodeWithMetadata();
        
        assertEq(blockNumber, block.number);
        assertEq(code, trap.getCurrentCode());
        assertTrue(nextRotationBlock > blockNumber);
        assertTrue((nextRotationBlock % 5) == 0);
    }
    
    function testVerifyCode() public {
        uint256 currentCode = trap.getCurrentCode();
        assertTrue(trap.verifyCode(currentCode), "Current code should be valid");
        assertFalse(trap.verifyCode(currentCode + 1), "Wrong code should be invalid");
    }
    
    function testGetCodeForBlock() public {
        uint256 currentBlock = block.number;
        uint256 currentCode = trap.getCodeForBlock(currentBlock);
        assertEq(currentCode, trap.getCurrentCode());
        
        // Test future block
        uint256 futureBlock = currentBlock + 10;
        uint256 futureCode = trap.getCodeForBlock(futureBlock);
        assertTrue(futureCode < 1_000_000);
    }
    
    function testDifferentSeeds() public {
        DroseraTrap trap2 = new DroseraTrap(54321);
        
        uint256 code1 = trap.getCurrentCode();
        uint256 code2 = trap2.getCurrentCode();
        
        // Different seeds should produce different codes
        assertTrue(code1 != code2, "Different seeds should produce different codes");
    }
    
    function testCodeRange() public {
        // Test multiple blocks to ensure codes stay in range
        for (uint256 i = 0; i < 100; i++) {
            vm.roll(block.number + 1);
            uint256 code = trap.getCurrentCode();
            assertTrue(code < 1_000_000, "Code should always be less than 1,000,000");
            assertTrue(code >= 0, "Code should always be non-negative");
        }
    }
    
    function testTrapId() public {
        assertEq(trap.getTrapId(), address(trap));
    }
    
    function testGetCurrentCodeWithSpecificSeed() public {
        uint256 customSeed = 99999;
        uint256 code = trap.getCurrentCode(customSeed);
        assertTrue(code < 1_000_000);
        
        // Should be different from trap's own seed
        uint256 trapCode = trap.getCurrentCode();
        assertTrue(code != trapCode);
    }
}