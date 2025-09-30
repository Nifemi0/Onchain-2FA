// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Onchain Pull Verifier (multi-oracle, expiry, allowlist)
/// @notice Minimal verifier for a pull-based 2FA flow. Off-chain oracle(s) observe VerificationRequested events,
///         perform verification off-chain using encrypted seeds, and call back on-chain to fulfill results.
/// @dev Designed for testnet usage. Does not store secrets. Request IDs are provided by backend and must be unique.
contract Verifier {
    address public owner;

    enum Status { None, Pending, Success, Failed, Cancelled }

    struct Request {
        address requester; // who submitted the request tx (backend)
        bytes32 userId;    // opaque user identifier (e.g., keccak256(userAddr))
        uint64 createdAt;  // block.timestamp when requested
        uint64 expiryAt;   // timestamp after which oracle cannot fulfill
        Status status;
    }

    /// @dev requestId => Request
    mapping(bytes32 => Request) public requests;

    /// @dev oracle addr => allowed
    mapping(address => bool) public oracleAllowlist;

    // Events
    event VerificationRequested(bytes32 indexed requestId, address indexed requester, bytes32 indexed userId, uint64 createdAt, uint64 expiryAt);
    event VerificationFulfilled(bytes32 indexed requestId, bool success, address indexed oracle, uint64 fulfilledAt);
    event RequestCancelled(bytes32 indexed requestId, address indexed requester, uint64 cancelledAt);
    event OracleAllowed(address indexed oracle, address indexed setter);
    event OracleRevoked(address indexed oracle, address indexed setter);
    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);

    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Verifier: only owner");
        _;
    }

    modifier onlyOracle() {
        require(oracleAllowlist[msg.sender], "Verifier: only oracle");
        _;
    }

    constructor(address[] memory initialOracles) {
        owner = msg.sender;
        // add initial oracles if any
        for (uint i = 0; i < initialOracles.length; i++) {
            if (initialOracles[i] != address(0)) {
                oracleAllowlist[initialOracles[i]] = true;
                emit OracleAllowed(initialOracles[i], msg.sender);
            }
        }
    }

    // -----------------------
    // Owner / Admin
    // -----------------------
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Verifier: zero owner");
        emit OwnerTransferred(owner, newOwner);
        owner = newOwner;
    }

    function allowOracle(address oracle) external onlyOwner {
        require(oracle != address(0), "Verifier: zero oracle");
        oracleAllowlist[oracle] = true;
        emit OracleAllowed(oracle, msg.sender);
    }

    function revokeOracle(address oracle) external onlyOwner {
        require(oracleAllowlist[oracle], "Verifier: not allowed");
        oracleAllowlist[oracle] = false;
        emit OracleRevoked(oracle, msg.sender);
    }

    // -----------------------
    // Request lifecycle
    // -----------------------

    /// @notice Submit a verification request. Emits VerificationRequested event that oracle listens for.
    /// @param requestId Unique id for this request (must not be reused)
    /// @param userId Opaque user ID (e.g., keccak256(userAddress) or app-specific id)
    /// @param expirySeconds How many seconds from now the request stays valid (e.g., 60)
    function requestVerification(bytes32 requestId, bytes32 userId, uint64 expirySeconds) external {
        require(requestId != bytes32(0), "Verifier: bad requestId");
        Request storage R = requests[requestId];
        require(R.status == Status.None, "Verifier: id used");

        uint64 now64 = uint64(block.timestamp);
        uint64 expiryAt = now64 + expirySeconds;
        requests[requestId] = Request({
            requester: msg.sender,
            userId: userId,
            createdAt: now64,
            expiryAt: expiryAt,
            status: Status.Pending
        });

        emit VerificationRequested(requestId, msg.sender, userId, now64, expiryAt);
    }

    /// @notice Oracle fulfills a pending verification. Only callable by allowlisted oracle.
    /// @param requestId request id to fulfill
    /// @param success verification result
    function fulfillVerification(bytes32 requestId, bool success) external onlyOracle {
        Request storage R = requests[requestId];
        require(R.status == Status.Pending, "Verifier: not pending");
        // Check expiry
        require(uint64(block.timestamp) <= R.expiryAt, "Verifier: expired");

        R.status = success ? Status.Success : Status.Failed;
        emit VerificationFulfilled(requestId, success, msg.sender, uint64(block.timestamp));
    }

    /// @notice Requester cancels a pending request (e.g., timeout or user aborted)
    /// @param requestId id to cancel
    function cancelRequest(bytes32 requestId) external {
        Request storage R = requests[requestId];
        require(R.status == Status.Pending, "Verifier: not pending");
        require(R.requester == msg.sender || msg.sender == owner, "Verifier: only requester or owner");
        R.status = Status.Cancelled;
        emit RequestCancelled(requestId, msg.sender, uint64(block.timestamp));
    }

    // -----------------------
    // Helpers / Views
    // -----------------------

    /// @notice Return numeric status (0=None,1=Pending,2=Success,3=Failed,4=Cancelled)
    function getStatus(bytes32 requestId) external view returns (uint8) {
        return uint8(requests[requestId].status);
    }

    /// @notice Return request tuple
    function getRequest(bytes32 requestId) external view returns (address requester, bytes32 userId, uint64 createdAt, uint64 expiryAt, uint8 status) {
        Request storage R = requests[requestId];
        return (R.requester, R.userId, R.createdAt, R.expiryAt, uint8(R.status));
    }

    // Fallbacks: do not accept ETH
    receive() external payable {
        revert("Verifier: no funds");
    }
    fallback() external payable {
        revert("Verifier: fallback");
    }
}
