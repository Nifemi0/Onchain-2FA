# Drosera Trap Smart Contract

The core smart contract that generates rotating 6-digit authentication codes using blockchain state.

## 📋 Overview

The `DroseraTrap` contract implements a deterministic code generation system that:
- Generates 6-digit codes (000000-999999)
- Rotates codes every 5 blocks
- Uses keccak256 hashing for security
- Provides read-only access for frontend integration

## 🏗️ Contract Architecture

### Core Functions

- `getCurrentCode()` - Returns the current 6-digit code
- `getCurrentCodeWithMetadata()` - Returns code with block and rotation info
- `verifyCode(uint256 _code)` - Validates a given code
- `getTrapId()` - Returns the contract address (trap ID)

### Key Parameters

- `ROTATION_INTERVAL = 5` - Blocks between code rotations
- `MAX_CODE = 1_000_000` - Maximum code value (6 digits)
- `trapSeed` - Unique identifier for each trap instance

## 🚀 Deployment

### Local Development

```bash
# Start Anvil (in separate terminal)
anvil

# Deploy to local network
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

### Sepolia Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export NETWORK=sepolia
export TRAP_SEED=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Deploy to Sepolia
forge script script/DeployToNetwork.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Mainnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export NETWORK=mainnet
export TRAP_SEED=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Deploy to Mainnet
forge script script/DeployToNetwork.s.sol --rpc-url $MAINNET_RPC_URL --broadcast --verify
```

## 🧪 Testing

Run the comprehensive test suite:

```bash
forge test -vv
```

### Test Coverage

- ✅ Contract initialization
- ✅ Code generation and determinism
- ✅ Code rotation intervals
- ✅ Code range validation (0-999999)
- ✅ Different trap seeds
- ✅ Metadata functions
- ✅ Code verification
- ✅ Block-specific code generation

## 📊 Gas Usage

| Function | Gas Cost |
|----------|----------|
| `getCurrentCode()` | ~2,500 |
| `getCurrentCodeWithMetadata()` | ~3,000 |
| `verifyCode()` | ~2,800 |
| `getTrapId()` | ~2,200 |

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key_here
TRAP_SEED=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Foundry Configuration

The `foundry.toml` file contains:
- Solidity compiler version (0.8.19)
- Optimization settings
- Test configuration
- Fuzzing parameters

## 🔍 Code Generation Algorithm

```solidity
function getCurrentCode(uint256 _trapSeed) public view returns (uint256) {
    // Calculate rotation key based on current block
    uint256 rotationKey = block.number / ROTATION_INTERVAL;
    
    // Generate deterministic hash
    bytes32 hash = keccak256(abi.encodePacked(rotationKey, _trapSeed));
    
    // Convert to 6-digit code
    return uint256(hash) % MAX_CODE;
}
```

### Security Properties

1. **Deterministic**: Same inputs always produce same output
2. **Unpredictable**: Cannot predict future codes without knowing trap seed
3. **Time-based**: Codes rotate every 5 blocks (~1 minute on Ethereum)
4. **Collision-resistant**: Keccak256 provides cryptographic security

## 📈 Monitoring

### Events

The contract emits `CodeGenerated` events for monitoring:

```solidity
event CodeGenerated(uint256 indexed trapId, uint256 code, uint256 blockNumber);
```

### Block Explorer

After deployment, verify the contract on Etherscan:
1. Run deployment script with `--verify` flag
2. Contract will be automatically verified
3. View source code and interact with functions

## 🛠️ Development

### Adding New Features

1. Implement new functions in `DroseraTrap.sol`
2. Add corresponding tests in `DroseraTrap.t.sol`
3. Update deployment scripts if needed
4. Run tests to ensure compatibility

### Gas Optimization

- Use `view` functions for read-only operations
- Minimize storage operations
- Optimize for common use cases
- Consider gas costs for frontend integration

## 📚 References

- [Foundry Book](https://book.getfoundry.sh/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Ethereum Gas Optimization](https://ethereum.org/en/developers/docs/gas/)