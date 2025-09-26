require('dotenv').config();
const { ethers } = require('ethers');
const notp = require('notp');
const base32 = require('thirty-two');

const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// In a real-world application, you would use a secure database to store user secrets.
// For this example, we'll use a simple object.
const userSecrets = {
    // This should be populated from a secure source, e.g., a database
    // The key is the keccak256 hash of the user's address or another unique identifier
    [process.env.USER_ID]: {
        secret: process.env.USER_ID_TOTP_SECRET
    }
};

const verifierAbi = [{"type":"constructor","inputs":[{"name":"initialOracles","type":"address[]","internalType":"address[]"}],"stateMutability":"nonpayable"},{"type":"fallback","stateMutability":"payable"},{"type":"receive","stateMutability":"payable"},{"type":"function","name":"allowOracle","inputs":[{"name":"oracle","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"cancelRequest","inputs":[{"name":"requestId","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"fulfillVerification","inputs":[{"name":"requestId","type":"bytes32","internalType":"bytes32"},{"name":"success","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getRequest","inputs":[{"name":"requestId","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"requester","type":"address","internalType":"address"},{"name":"userId","type":"bytes32","internalType":"bytes32"},{"name":"createdAt","type":"uint64","internalType":"uint64"},{"name":"expiryAt","type":"uint64","internalType":"uint64"},{"name":"status","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},{"type":"function","name":"getStatus","inputs":[{"name":"requestId","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},{"type":"function","name":"oracleAllowlist","inputs":[{"name":"","type":"address","internalType":"address"}],"outputs":[{"name":"","type":"bool","internalType":"bool"}],"stateMutability":"view"},{"type":"function","name":"owner","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"requestVerification","inputs":[{"name":"requestId","type":"bytes32","internalType":"bytes32"},{"name":"userId","type":"bytes32","internalType":"bytes32"},{"name":"expirySeconds","type":"uint64","internalType":"uint64"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"requests","inputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"requester","type":"address","internalType":"address"},{"name":"userId","type":"bytes32","internalType":"bytes32"},{"name":"createdAt","type":"uint64","internalType":"uint64"},{"name":"expiryAt","type":"uint64","internalType":"uint64"},{"name":"status","type":"uint8","internalType":"uint8"}],"stateMutability":"view"},{"type":"function","name":"revokeOracle","inputs":[{"name":"oracle","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"event","name":"OracleAllowed","inputs":[{"name":"oracle","type":"address","indexed":true,"internalType":"address"},{"name":"setter","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"OracleRevoked","inputs":[{"name":"oracle","type":"address","indexed":true,"internalType":"address"},{"name":"setter","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"OwnerTransferred","inputs":[{"name":"oldOwner","type":"address","indexed":true,"internalType":"address"},{"name":"newOwner","type":"address","indexed":true,"internalType":"address"}],"anonymous":false},{"type":"event","name":"RequestCancelled","inputs":[{"name":"requestId","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"requester","type":"address","indexed":true,"internalType":"address"},{"name":"cancelledAt","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"event","name":"VerificationFulfilled","inputs":[{"name":"requestId","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"success","type":"bool","indexed":false,"internalType":"bool"},{"name":"oracle","type":"address","indexed":true,"internalType":"address"},{"name":"fulfilledAt","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"event","name":"VerificationRequested","inputs":[{"name":"requestId","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"requester","type":"address","indexed":true,"internalType":"address"},{"name":"userId","type":"bytes32","indexed":true,"internalType":"bytes32"},{"name":"createdAt","type":"uint64","indexed":false,"internalType":"uint64"},{"name":"expiryAt","type":"uint64","indexed":false,"internalType":"uint64"}],"anonymous":false},{"type":"error","name":"Verifier__Expired","inputs":[]},{"type":"error","name":"Verifier__NotAllowed","inputs":[]},{"type":"error","name":"Verifier__NotPending","inputs":[]},{"type":"error","name":"Verifier__NotPendingOrOwner","inputs":[]},{"type":"error","name":"Verifier__RequestIdUsed","inputs":[]},{"type":"error","name":"Verifier__ZeroAddress","inputs":[]}];

const verifier = new ethers.Contract(process.env.VERIFIER_CONTRACT_ADDRESS, verifierAbi, wallet);

console.log('Oracle started. Listening for VerificationRequested events...');

verifier.on('VerificationRequested', async (requestId, requester, userId, createdAt, expiryAt) => {
    console.log(`Verification requested:`);
    console.log(`  RequestId: ${requestId}`);
    console.log(`  Requester: ${requester}`);
    console.log(`  UserId: ${userId}`);
    console.log(`  CreatedAt: ${new Date(createdAt * 1000)}`);
    console.log(`  ExpiryAt: ${new Date(expiryAt * 1000)}`);

    const user = userSecrets[userId];
    if (!user || !user.secret) {
        console.log(`  No secret found for user ${userId}. Fulfilling with 'false'.`);
        await fulfill(requestId, false);
        return;
    }

    // In a real-world scenario, the user would provide a TOTP code to a separate API endpoint.
    // The oracle would then verify the provided code against the generated code.
    // For this example, we will generate the code and assume it's the one the user provided.
    const generatedToken = notp.totp.gen(base32.decode(user.secret));
    console.log(`  Generated TOTP for user ${userId}: ${generatedToken}`);

    // Here you would compare the generated token with the one provided by the user.
    // For this simulation, we'll just assume it's correct.
    const isVerified = true; 

    await fulfill(requestId, isVerified);
});

async function fulfill(requestId, success) {
    try {
        const tx = await verifier.fulfillVerification(requestId, success);
        console.log(`  Fulfilling verification with ${success}... Tx hash: ${tx.hash}`);
        await tx.wait();
        console.log('  Verification fulfilled.');
    } catch (error) {
        console.error('  Error fulfilling verification:', error);
    }
}