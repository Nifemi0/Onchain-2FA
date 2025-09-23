# Drosera Authenticator Backend

A Node.js/Express API server that provides code verification services for the Drosera Authenticator frontend.

## 🎯 Purpose

The backend serves as a verification service that:
- Validates authentication codes without requiring blockchain calls
- Provides off-chain verification for testing and development
- Implements the same code generation algorithm as the smart contract
- Offers a RESTful API for frontend integration

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Web3**: Ethers.js for blockchain interactions
- **Environment**: dotenv for configuration

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to Ethereum RPC endpoint (Infura, Alchemy, etc.)

### Installation

```bash
cd backend
npm install
```

### Configuration

1. **Environment Variables**:

   Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
   ```

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3001`

### Production

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "success": true,
  "message": "Drosera Authenticator Backend is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 123.456
}
```

### Code Verification

```http
POST /verify
Content-Type: application/json

{
  "code": 123456,
  "trapId": "0x...",
  "blockNumber": 12345
}
```

**Response (Valid Code):**
```json
{
  "success": true,
  "valid": true,
  "message": "Code is valid",
  "computedCode": 123456,
  "blockNumber": 12345
}
```

**Response (Invalid Code):**
```json
{
  "success": true,
  "valid": false,
  "message": "Code is invalid",
  "computedCode": 789012,
  "blockNumber": 12345
}
```

**Error Response:**
```json
{
  "success": false,
  "valid": false,
  "message": "Missing required fields: code and trapId are required"
}
```

## 🏗️ Architecture

### Project Structure

```
src/
├── server.ts              # Main server file
├── routes/
│   ├── health.ts          # Health check endpoint
│   └── verify.ts          # Code verification endpoint
└── utils/
    └── codeGenerator.ts   # Code generation utilities
```

### Code Generation Algorithm

The backend implements the same algorithm as the smart contract:

```typescript
export function computeCode(trapSeed: string, blockNumber: number): number {
  const ROTATION_INTERVAL = 5;
  const MAX_CODE = 1_000_000;
  
  const rotationKey = Math.floor(blockNumber / ROTATION_INTERVAL);
  const hash = ethers.keccak256(
    ethers.solidityPacked(['uint256', 'uint256'], [rotationKey, trapSeed])
  );
  
  return Number(BigInt(hash) % BigInt(MAX_CODE));
}
```

### Verification Process

1. **Input Validation**: Validate code and trapId parameters
2. **Block Number**: Fetch current block if not provided
3. **Trap Seed**: Retrieve trap seed from smart contract
4. **Code Computation**: Compute expected code using same algorithm
5. **Comparison**: Compare provided code with computed code
6. **Response**: Return validation result

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |
| `RPC_URL` | Ethereum RPC endpoint | Required |

### CORS Configuration

The server is configured to accept requests from the frontend:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## 🧪 Testing

### Running Tests

```bash
npm test
```

### Test Coverage

- Code generation algorithm
- Input validation
- Error handling
- API endpoints

### Manual Testing

Test the verification endpoint:

```bash
curl -X POST http://localhost:3001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": 123456,
    "trapId": "0x...",
    "blockNumber": 12345
  }'
```

## 🔒 Security

### Input Validation

- **Code Range**: Must be between 0 and 999999
- **Address Format**: trapId must be valid Ethereum address
- **Type Checking**: Strict TypeScript types for all inputs

### Error Handling

- **Graceful Degradation**: Server continues running on errors
- **Error Logging**: Comprehensive error logging
- **User-Friendly Messages**: Clear error messages for clients

### Rate Limiting

Consider adding rate limiting for production:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/verify', limiter);
```

## 📊 Monitoring

### Health Checks

The `/health` endpoint provides:
- Server uptime
- Current timestamp
- Version information
- Success status

### Logging

The server logs:
- Request details
- Error information
- Performance metrics

### Metrics

Consider adding metrics collection:
- Request count
- Response times
- Error rates
- Code verification success rate

## 🚀 Deployment

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

### Railway

1. Connect GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Heroku

1. Create Heroku app
2. Set environment variables
3. Deploy using Git:

```bash
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Environment Variables for Production

```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
```

## 🔧 Development

### Code Style

- **TypeScript**: Strict type checking
- **ESLint**: Code linting
- **Prettier**: Code formatting

### Debugging

- **Console Logging**: Comprehensive logging
- **Error Stack Traces**: Detailed error information
- **Development Mode**: Enhanced error messages

### Performance

- **Connection Pooling**: Efficient database connections
- **Caching**: Consider adding Redis for caching
- **Compression**: Enable gzip compression

## 📚 API Documentation

### Request/Response Examples

#### Valid Code Verification

```bash
curl -X POST http://localhost:3001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": 123456,
    "trapId": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6",
    "blockNumber": 12345
  }'
```

#### Invalid Code Verification

```bash
curl -X POST http://localhost:3001/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": 999999,
    "trapId": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6"
  }'
```

### Error Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Not Found |
| 500 | Internal Server Error |

## 🔍 Troubleshooting

### Common Issues

1. **RPC Connection Failed**
   - Check RPC_URL environment variable
   - Verify network connectivity
   - Ensure RPC endpoint is accessible

2. **Contract Not Found**
   - Verify trapId is a valid contract address
   - Check if contract is deployed on the network
   - Ensure contract has the required functions

3. **Code Validation Fails**
   - Check if block number is correct
   - Verify trap seed matches contract
   - Ensure code generation algorithm is consistent

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Ethers.js Documentation](https://docs.ethers.io/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)