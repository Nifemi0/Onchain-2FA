// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DroseraTrap} from "../src/DroseraTrap.sol";

contract DeployToNetwork is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        string memory network = vm.envString("NETWORK");
        
        console.log("Deploying to network:", network);
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Get trap seed from environment or use default
        uint256 trapSeed;
        try vm.envUint("TRAP_SEED") returns (uint256 seed) {
            trapSeed = seed;
        } catch {
            // Default seed if not provided
            trapSeed = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        }
        
        console.log("Using trap seed:", trapSeed);
        
        DroseraTrap trap = new DroseraTrap(trapSeed);
        
        console.log("DroseraTrap deployed to:", address(trap));
        console.log("Trap Seed:", trap.trapSeed());
        console.log("Current Code:", trap.getCurrentCode());
        
        // Get current code with metadata
        (uint256 code, uint256 blockNumber, uint256 nextRotationBlock) = trap.getCurrentCodeWithMetadata();
        console.log("Code:", code);
        console.log("Block Number:", blockNumber);
        console.log("Next Rotation Block:", nextRotationBlock);
        
        vm.stopBroadcast();
        
        // Output deployment info for frontend configuration
        console.log("\n=== DEPLOYMENT INFO ===");
        console.log("CONTRACT_ADDRESS=", address(trap));
        console.log("TRAP_SEED=", trapSeed);
        console.log("NETWORK=", network);
        console.log("========================");
    }
}