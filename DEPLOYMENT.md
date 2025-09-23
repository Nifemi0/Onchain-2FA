# Deployment Guide

This guide covers deploying the Drosera Authenticator project to various platforms and networks.

## 📋 Prerequisites

- Node.js 18+ and npm
- Foundry (for smart contract deployment)
- Git
- Ethereum wallet with testnet/mainnet funds
- RPC provider account (Infura, Alchemy, etc.)

## 🏗️ Smart Contract Deployment

### 1. Local Development Setup

#### Start Local Blockchain

```bash
# Install and start Anvil (Foundry's local blockchain)
anvil

# Anvil will start on http://localhost:8545
# Default accounts with 10,000 ETH each will be available
```

#### Deploy to Local Network

```bash
cd contracts

# Deploy to local network
forge script script/DeployLocal.s.sol --rpc-url http://localhost:8545 --broadcast

# Note the contract address from the output
```

### 2. Sepolia Testnet Deployment

#### Setup Environment

```bash
cd contracts

# Create .env file
cp .env.example .env

# Edit .env with your values
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
ETHERSCAN_API_KEY=your_etherscan_api_key_here
TRAP_SEED=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

#### Deploy to Sepolia

```bash
# Set network environment variable
export NETWORK=sepolia

# Deploy with verification
forge script script/DeployToNetwork.s.sol \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY

# Note the contract address from the output
```

#### Get Sepolia ETH

If you need testnet ETH:
1. Visit [Sepolia Faucet](https://sepoliafaucet.com/)
2. Connect your wallet
3. Request testnet ETH

### 3. Mainnet Deployment

⚠️ **Warning**: Only deploy to mainnet after thorough testing on testnets.

```bash
# Set network environment variable
export NETWORK=mainnet

# Deploy to mainnet
forge script script/DeployToNetwork.s.sol \
  --rpc-url $MAINNET_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

## 🌐 Frontend Deployment

### 1. Vercel Deployment (Recommended)

#### Automatic Deployment

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com/)
   - Import your GitHub repository
   - Select the `frontend` folder as root directory

2. **Configure Build Settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

3. **Environment Variables**:
   ```
   NEXT_PUBLIC_DEFAULT_CONTRACT_ADDRESS=0x...
   NEXT_PUBLIC_DEFAULT_NETWORK=sepolia
   ```

4. **Deploy**:
   - Click "Deploy"
   - Vercel will automatically deploy on every push to main branch

#### Manual Deployment

```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_DEFAULT_CONTRACT_ADDRESS
vercel env add NEXT_PUBLIC_DEFAULT_NETWORK
```

### 2. Netlify Deployment

#### Automatic Deployment

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com/)
   - Import your GitHub repository
   - Set build settings:
     - Build command: `cd frontend && npm run build`
     - Publish directory: `frontend/.next`

2. **Environment Variables**:
   - Add in Netlify dashboard under Site settings > Environment variables

3. **Deploy**:
   - Netlify will automatically deploy on every push

#### Manual Deployment

```bash
cd frontend

# Build the project
npm run build

# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=.next
```

### 3. Docker Deployment

#### Create Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Build and Run

```bash
cd frontend

# Build Docker image
docker build -t drosera-authenticator-frontend .

# Run container
docker run -p 3000:3000 drosera-authenticator-frontend
```

## 🔧 Backend Deployment

### 1. Railway Deployment

#### Automatic Deployment

1. **Connect Repository**:
   - Go to [Railway](https://railway.app/)
   - Import your GitHub repository
   - Select the `backend` folder

2. **Environment Variables**:
   ```
   PORT=3001
   NODE_ENV=production
   FRONTEND_URL=https://your-frontend-domain.com
   RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

3. **Deploy**:
   - Railway will automatically deploy on every push

#### Manual Deployment

```bash
cd backend

# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy
railway up
```

### 2. Heroku Deployment

#### Automatic Deployment

1. **Create Heroku App**:
   ```bash
   heroku create drosera-authenticator-backend
   ```

2. **Set Environment Variables**:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set FRONTEND_URL=https://your-frontend-domain.com
   heroku config:set RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

3. **Deploy**:
   ```bash
   git subtree push --prefix backend heroku main
   ```

### 3. Docker Deployment

#### Create Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
```

#### Build and Run

```bash
cd backend

# Build Docker image
docker build -t drosera-authenticator-backend .

# Run container
docker run -p 3001:3001 \
  -e RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID \
  -e FRONTEND_URL=https://your-frontend-domain.com \
  drosera-authenticator-backend
```

## 🔗 Integration

### 1. Update Frontend Configuration

After deploying the smart contract, update the frontend configuration:

```typescript
// frontend/src/lib/config.ts
export const APP_CONFIG = {
  contracts: {
    sepolia: '0x...' as `0x${string}`, // Your deployed contract address
    localhost: '0x...' as `0x${string}`, // Local contract address
  },
  // ... other config
};
```

### 2. Update Backend Configuration

Update the backend environment variables:

```env
# backend/.env
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
FRONTEND_URL=https://your-frontend-domain.com
```

### 3. Test Integration

1. **Frontend**: Visit your deployed frontend URL
2. **Backend**: Test the health endpoint: `https://your-backend-domain.com/health`
3. **Smart Contract**: Verify on Etherscan and test functions

## 🔍 Verification

### 1. Smart Contract Verification

After deployment, verify the contract on Etherscan:

```bash
# Verification is automatic if you used --verify flag
# Or verify manually:
forge verify-contract \
  --chain-id 11155111 \
  --num-of-optimizations 200 \
  --watch \
  --etherscan-api-key $ETHERSCAN_API_KEY \
  <CONTRACT_ADDRESS> \
  src/DroseraTrap.sol:DroseraTrap
```

### 2. Frontend Testing

Test the deployed frontend:
1. Open the URL in a browser
2. Verify the authenticator displays correctly
3. Test the copy functionality
4. Check responsive design on mobile

### 3. Backend Testing

Test the deployed backend:

```bash
# Health check
curl https://your-backend-domain.com/health

# Code verification
curl -X POST https://your-backend-domain.com/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": 123456,
    "trapId": "0x...",
    "blockNumber": 12345
  }'
```

## 📊 Monitoring

### 1. Smart Contract Monitoring

- **Etherscan**: Monitor contract interactions
- **Events**: Watch for `CodeGenerated` events
- **Gas Usage**: Track gas consumption

### 2. Frontend Monitoring

- **Vercel Analytics**: Built-in analytics for Vercel deployments
- **Google Analytics**: Add tracking code
- **Error Monitoring**: Consider Sentry for error tracking

### 3. Backend Monitoring

- **Health Checks**: Monitor `/health` endpoint
- **Logs**: Review application logs
- **Performance**: Monitor response times

## 🚨 Troubleshooting

### Common Issues

1. **Contract Deployment Fails**:
   - Check private key and RPC URL
   - Ensure sufficient funds for gas
   - Verify network connectivity

2. **Frontend Build Fails**:
   - Check Node.js version (18+)
   - Verify all dependencies are installed
   - Check for TypeScript errors

3. **Backend Connection Issues**:
   - Verify RPC URL is accessible
   - Check environment variables
   - Ensure CORS is configured correctly

### Debug Commands

```bash
# Check contract deployment
forge script script/DeployToNetwork.s.sol --rpc-url $RPC_URL --dry-run

# Test frontend build locally
cd frontend && npm run build

# Test backend locally
cd backend && npm run dev
```

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app/)
- [Heroku Documentation](https://devcenter.heroku.com/)
- [Docker Documentation](https://docs.docker.com/)