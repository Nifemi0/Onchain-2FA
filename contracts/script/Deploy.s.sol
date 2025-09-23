// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {DroseraTrap} from "../src/DroseraTrap.sol";

contract DeployScript is Script {
    function setUp() public {}
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy with a random seed (you can change this)
        uint256 trapSeed = 0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef;
        
        DroseraTrap trap = new DroseraTrap(trapSeed);
        
        console.log("DroseraTrap deployed to:", address(trap));
        console.log("Trap Seed:", trap.trapSeed());
        console.log("Current Code:", trap.getCurrentCode());
        
        vm.stopBroadcast();
    }
}