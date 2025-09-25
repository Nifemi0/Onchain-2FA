## Backend Setup (Verifier + Registration)

### Env
Create a `.env` in `trap-authenticator/` with:

- PORT=3000
- CORS_ORIGIN=http://127.0.0.1:8080
- RPC_URL=<hoodi rpc>
- VERIFIER_ADDRESS=0xbee65c3c00926c96d6888faeb13b30e1c3b061fa
- BACKEND_PRIVATE_KEY=<your backend signer>
- EXPIRY_SECONDS=120
- MASTER_KEY_B64=<base64 32 bytes> OR MASTER_ENC_KEY=<hex 32 bytes>
- API_HMAC_KEY=<hex, optional)

### Install & Run

- npm install
- npm start

### API

- POST /api/register { userId, trapId, chainId }
- POST /api/verify { userId, code } → { requestId, txHash }
- GET  /api/status/:requestId → { found, result }
- GET  /api/request/:requestId (HMAC protected if API_HMAC_KEY set)
- GET  /api/health
