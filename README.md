# Drosera Authenticator

> **Google Authenticator, but powered by Drosera**

A minimal web-based authenticator app that generates rotating 6-digit codes using blockchain state. No wallet connection required - just read-only calls to the Drosera Trap smart contract.

## 🚀 Features

- **Fast & Lightweight**: No wallet connection required, just read-only blockchain calls
- **Secure by Design**: Codes generated deterministically from blockchain state and trap seeds
- **Developer Friendly**: Clean API, comprehensive tests, and easy deployment to testnets
- **Real-time Updates**: Codes refresh every 5 blocks with countdown timer
- **Copy to Clipboard**: One-click code copying functionality
- **Responsive Design**: Works on desktop and mobile devices

## 📁 Project Structure

```
drosera-authenticator/
├── contracts/          # Smart contracts (Foundry)
│   ├── src/
│   │   └── DroseraTrap.sol
│   ├── test/
│   │   └── DroseraTrap.t.sol
│   ├── script/
│   │   ├── Deploy.s.sol
│   │   ├── DeployToNetwork.s.sol
│   │   └── DeployLocal.s.sol
│   └── foundry.toml
├── frontend/           # Next.js web app
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── lib/
│   └── package.json
├── backend/            # Node.js API server
│   ├── src/
│   │   ├── routes/
│   │   └── utils/
│   └── package.json
└── README.md
```

## 🛠️ How It Works

### Smart Contract Logic

The `DroseraTrap` contract generates deterministic 6-digit codes based on:

1. **Block Number**: Codes rotate every 5 blocks
2. **Trap Seed**: Unique identifier for each trap instance
3. **Keccak256 Hash**: Deterministic but unpredictable code generation

```solidity
function getCurrentCode(uint256 _trapSeed) public view returns (uint256) {
    uint256 rotationKey = block.number / ROTATION_INTERVAL;
    bytes32 hash = keccak256(abi.encodePacked(rotationKey, _trapSeed));
    return uint256(hash) % MAX_CODE;
}
```

### Frontend Integration

The Next.js frontend:
- Fetches current code from the smart contract every 2 seconds
- Displays a countdown timer until the next code rotation
- Provides copy-to-clipboard functionality
- Shows contract metadata and network information

### Backend Verification

The Node.js backend provides a `/verify` endpoint that:
- Validates codes without requiring blockchain calls
- Recomputes expected codes using the same algorithm
- Returns verification results for testing purposes

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contract development)
- Git

### 1. Clone and Setup

```bash
git clone <repository-url>
cd drosera-authenticator
```

### 2. Smart Contract Setup

```bash
cd contracts

# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup

# Run tests
forge test -vv

# Deploy to local network (requires anvil running)
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 4. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The backend will be available at `http://localhost:3001`

## 🔧 Configuration

### Smart Contract Deployment

1. **Local Development**:
   ```bash
   # Start Anvil (in separate terminal)
   anvil
   
   # Deploy to local network
   forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast
   ```

2. **Sepolia Testnet**:
   ```bash
   # Set environment variables
   export PRIVATE_KEY=your_private_key
   export NETWORK=sepolia
   export TRAP_SEED=0x1234567890abcdef...
   
   # Deploy to Sepolia
   forge script script/DeployToNetwork.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
   ```

### Frontend Configuration

Update the contract address in `/frontend/src/lib/config.ts`:

```typescript
export const APP_CONFIG = {
  contracts: {
    sepolia: '0x...' as `0x${string}`, // Your deployed contract address
    localhost: '0x...' as `0x${string}`, // Local contract address
  },
  // ... other config
};
```

### Backend Configuration

Create a `.env` file in the backend directory:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

## 🧪 Testing

### Smart Contract Tests

```bash
cd contracts
forge test -vv
```

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 📡 API Endpoints

### Backend API

- `GET /health` - Health check endpoint
- `POST /verify` - Verify a code

#### Verify Endpoint

```bash
curl -X POST http://localhost:3001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": 123456,
    "trapId": "0x...",
    "blockNumber": 12345
  }'
```

Response:
```json
{
  "success": true,
  "valid": true,
  "message": "Code is valid",
  "computedCode": 123456,
  "blockNumber": 12345
}
```

## 🔒 Security Considerations

1. **Code Generation**: Codes are deterministic but unpredictable due to keccak256 hashing
2. **Block Dependencies**: Codes rotate every 5 blocks, providing natural time-based rotation
3. **No Private Keys**: Frontend only makes read-only calls, no private key exposure
4. **Validation**: Backend can verify codes without blockchain calls for testing

## 🌐 Deployment

### Frontend (Vercel/Netlify)

1. Connect your repository to Vercel/Netlify
2. Set environment variables for contract addresses
3. Deploy automatically on push to main branch

### Backend (Railway/Heroku)

1. Connect your repository to Railway/Heroku
2. Set environment variables in the platform dashboard
3. Deploy automatically on push to main branch

### Smart Contract (Sepolia/Mainnet)

1. Set up environment variables
2. Run deployment script
3. Verify contract on Etherscan
4. Update frontend configuration with new address

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Smart contracts developed with [Foundry](https://book.getfoundry.sh/)
- Web3 integration using [Viem](https://viem.sh/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For questions or support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ by the Drosera Network team**