// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/Verifier.sol";

contract VerifierTest is Test {
    Verifier public verifier;
    address public owner = address(this);
    address public oracle = address(0x1);
    address public requester = address(0x2);

    function setUp() public {
        address[] memory initialOracles = new address[](0);
        verifier = new Verifier(initialOracles);
    }

    function testRequestVerification() public {
        bytes32 requestId = keccak256("test1");
        bytes32 userId = keccak256("user1");
        uint64 expirySeconds = 60;

        vm.prank(requester);
        verifier.requestVerification(requestId, userId, expirySeconds);

        (address req, bytes32 uid, uint64 createdAt, uint64 expiryAt, uint8 status) = verifier.getRequest(requestId);

        assertEq(req, requester);
        assertEq(uid, userId);
        assertEq(uint8(Verifier.Status.Pending), status);
    }

    function testFulfillVerification() public {
        bytes32 requestId = keccak256("test2");
        bytes32 userId = keccak256("user2");
        uint64 expirySeconds = 60;

        // Allow oracle
        verifier.allowOracle(oracle);

        // Request verification
        vm.prank(requester);
        verifier.requestVerification(requestId, userId, expirySeconds);

        // Fulfill verification
        vm.prank(oracle);
        verifier.fulfillVerification(requestId, true);

        uint8 status = verifier.getStatus(requestId);
        assertEq(status, uint8(Verifier.Status.Success));
    }

    function testFulfillVerificationByNonOracle() public {
        bytes32 requestId = keccak256("test3");
        bytes32 userId = keccak256("user3");
        uint64 expirySeconds = 60;

        // Request verification
        vm.prank(requester);
        verifier.requestVerification(requestId, userId, expirySeconds);

        // Fulfill verification by non-oracle (should fail)
        vm.prank(address(0x3));
        vm.expectRevert("Verifier: only oracle");
        verifier.fulfillVerification(requestId, true);
    }

    function testCancelRequest() public {
        bytes32 requestId = keccak256("test4");
        bytes32 userId = keccak256("user4");
        uint64 expirySeconds = 60;

        // Request verification
        vm.prank(requester);
        verifier.requestVerification(requestId, userId, expirySeconds);

        // Cancel request
        vm.prank(requester);
        verifier.cancelRequest(requestId);

        uint8 status = verifier.getStatus(requestId);
        assertEq(status, uint8(Verifier.Status.Cancelled));
    }
}
