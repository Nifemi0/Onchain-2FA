import { createPublicClient, http, formatUnits, parseUnits } from 'viem';
import { sepolia, mainnet } from 'viem/chains';
import { DROSERA_TRAP_ABI, CONTRACT_CONFIG } from './contracts';
import { getConfig } from './config';

// Create public clients for different networks
export const publicClients = {
  sepolia: createPublicClient({
    chain: sepolia,
    transport: http(CONTRACT_CONFIG.sepolia.rpcUrl),
  }),
  mainnet: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
  localhost: createPublicClient({
    chain: {
      id: 31337,
      name: 'Localhost',
      network: 'localhost',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: {
        default: { http: ['http://localhost:8545'] },
        public: { http: ['http://localhost:8545'] },
      },
    },
    transport: http(CONTRACT_CONFIG.localhost.rpcUrl),
  }),
};

// Get the current network based on environment
export function getCurrentNetwork(): keyof typeof publicClients {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'localhost';
    }
  }
  
  // Default to sepolia for production
  return 'sepolia';
}

// Get the contract address for the current network
export function getContractAddress(): `0x${string}` {
  const config = getConfig();
  const network = getCurrentNetwork();
  
  // Use config contracts first, fallback to CONTRACT_CONFIG
  const configAddress = config.contracts[network];
  if (configAddress) {
    return configAddress;
  }
  
  return CONTRACT_CONFIG[network].contractAddress;
}

// Contract interaction functions
export async function getCurrentCode(contractAddress: `0x${string}`) {
  const network = getCurrentNetwork();
  const client = publicClients[network];
  
  try {
    const code = await client.readContract({
      address: contractAddress,
      abi: DROSERA_TRAP_ABI,
      functionName: 'getCurrentCode',
    });
    
    return Number(code);
  } catch (error) {
    console.error('Error fetching current code:', error);
    throw error;
  }
}

export async function getCurrentCodeWithMetadata(contractAddress: `0x${string}`) {
  const network = getCurrentNetwork();
  const client = publicClients[network];
  
  try {
    const result = await client.readContract({
      address: contractAddress,
      abi: DROSERA_TRAP_ABI,
      functionName: 'getCurrentCodeWithMetadata',
    });
    
    return {
      code: Number(result[0]),
      blockNumber: Number(result[1]),
      nextRotationBlock: Number(result[2]),
    };
  } catch (error) {
    console.error('Error fetching code metadata:', error);
    throw error;
  }
}

export async function verifyCode(contractAddress: `0x${string}`, code: number) {
  const network = getCurrentNetwork();
  const client = publicClients[network];
  
  try {
    const isValid = await client.readContract({
      address: contractAddress,
      abi: DROSERA_TRAP_ABI,
      functionName: 'verifyCode',
      args: [BigInt(code)],
    });
    
    return isValid;
  } catch (error) {
    console.error('Error verifying code:', error);
    throw error;
  }
}

export async function getTrapSeed(contractAddress: `0x${string}`) {
  const network = getCurrentNetwork();
  const client = publicClients[network];
  
  try {
    const seed = await client.readContract({
      address: contractAddress,
      abi: DROSERA_TRAP_ABI,
      functionName: 'trapSeed',
    });
    
    return seed.toString();
  } catch (error) {
    console.error('Error fetching trap seed:', error);
    throw error;
  }
}

// Utility function to format code with leading zeros
export function formatCode(code: number): string {
  return code.toString().padStart(6, '0');
}

// Utility function to copy text to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand('copy');
      textArea.remove();
      return result;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}