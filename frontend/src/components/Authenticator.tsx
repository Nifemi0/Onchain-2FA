'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  getCurrentCodeWithMetadata, 
  getContractAddress, 
  formatCode, 
  copyToClipboard,
  getCurrentNetwork 
} from '@/lib/web3';

interface AuthenticatorProps {
  contractAddress?: `0x${string}`;
}

interface CodeMetadata {
  code: number;
  blockNumber: number;
  nextRotationBlock: number;
}

export default function Authenticator({ contractAddress }: AuthenticatorProps) {
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const queryClient = useQueryClient();
  
  const address = contractAddress || getContractAddress();
  const network = getCurrentNetwork();

  // Fetch current code with metadata
  const { data: codeData, isLoading, error } = useQuery<CodeMetadata>({
    queryKey: ['currentCode', address],
    queryFn: () => getCurrentCodeWithMetadata(address),
    refetchInterval: 2000, // Refetch every 2 seconds
    retry: 3,
  });

  // Calculate time until next rotation
  useEffect(() => {
    if (!codeData) return;

    const calculateTimeLeft = () => {
      // Estimate time based on block intervals
      // Assuming ~12 seconds per block on Ethereum
      const blocksUntilRotation = codeData.nextRotationBlock - codeData.blockNumber;
      const estimatedSeconds = blocksUntilRotation * 12;
      setTimeLeft(Math.max(0, estimatedSeconds));
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [codeData]);

  // Copy code to clipboard
  const handleCopyCode = useCallback(async () => {
    if (!codeData) return;
    
    const success = await copyToClipboard(formatCode(codeData.code));
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [codeData]);

  // Format time as MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Connection Error
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Failed to connect to the Drosera Trap contract.
        </p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['currentCode'] })}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!codeData) {
    return (
      <div className="text-center p-8">
        <p className="text-gray-600 dark:text-gray-400">
          No contract address configured. Please deploy a Drosera Trap contract first.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Drosera Authenticator
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Network: {network} • Block: {codeData.blockNumber.toLocaleString()}
        </p>
      </div>

      {/* Code Display */}
      <div className="text-center mb-8">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-4">
          <div className="text-4xl font-mono font-bold text-gray-900 dark:text-white tracking-wider">
            {formatCode(codeData.code)}
          </div>
        </div>
        
        {/* Copy Button */}
        <button
          onClick={handleCopyCode}
          className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {copied ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy Code
            </span>
          )}
        </button>
      </div>

      {/* Timer */}
      <div className="text-center">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Code refreshes in:
        </div>
        <div className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
          {formatTime(timeLeft)}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
          Next rotation at block {codeData.nextRotationBlock.toLocaleString()}
        </div>
      </div>

      {/* Contract Info */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
          <div>Contract: {address.slice(0, 6)}...{address.slice(-4)}</div>
          <div>Rotation: Every 5 blocks</div>
        </div>
      </div>
    </div>
  );
}