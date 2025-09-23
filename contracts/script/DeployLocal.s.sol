// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DroseraTrap} from "../src/DroseraTrap.sol";

contract DeployLocal is Script {
    function run() public {
        // Use the first account from the local anvil instance
        uint256 deployerPrivateKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        
        console.log("Deploying to local network (Anvil)");
        console.log("Deployer address:", vm.addr(deployerPrivateKey));
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Use a test seed
        uint256 trapSeed = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        
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
        console.log("\n=== LOCAL DEPLOYMENT INFO ===");
        console.log("CONTRACT_ADDRESS=", address(trap));
        console.log("TRAP_SEED=", trapSeed);
        console.log("NETWORK=localhost");
        console.log("RPC_URL=http://localhost:8545");
        console.log("=============================");
    }
}