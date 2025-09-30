// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/Verifier.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();

        address[] memory initialOracles = new address[](0);
        Verifier verifier = new Verifier(initialOracles);

        console.log("Verifier contract deployed at:", address(verifier));

        vm.stopBroadcast();
    }
}
