// Configuration for the Drosera Authenticator app

export const APP_CONFIG = {
  // Default contract addresses for different networks
  // These will be updated after deployment
  contracts: {
    sepolia: '' as `0x${string}`, // Will be set after deployment
    localhost: '' as `0x${string}`, // Will be set after deployment
  },
  
  // App settings
  settings: {
    refreshInterval: 2000, // 2 seconds
    blockTime: 12, // Estimated seconds per block on Ethereum
    rotationInterval: 5, // Blocks between code rotations
  },
  
  // UI settings
  ui: {
    animationDuration: 200, // ms
    copyFeedbackDuration: 2000, // ms
  }
} as const;

// Environment-specific configuration
export function getConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  return {
    ...APP_CONFIG,
    isDevelopment,
    isLocalhost,
    defaultNetwork: isLocalhost ? 'localhost' : 'sepolia',
  };
}