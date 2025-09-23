import { Request, Response } from 'express';
import { ethers } from 'ethers';
import { computeCode } from '../utils/codeGenerator';

interface VerifyRequest {
  code: number;
  trapId: string;
  blockNumber?: number;
}

interface VerifyResponse {
  success: boolean;
  valid: boolean;
  message: string;
  computedCode?: number;
  blockNumber?: number;
}

export const verifyCodeEndpoint = async (req: Request, res: Response) => {
  try {
    const { code, trapId, blockNumber }: VerifyRequest = req.body;

    // Validate input
    if (!code || !trapId) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Missing required fields: code and trapId are required'
      } as VerifyResponse);
    }

    if (typeof code !== 'number' || code < 0 || code >= 1000000) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid code: must be a number between 0 and 999999'
      } as VerifyResponse);
    }

    if (!ethers.isAddress(trapId)) {
      return res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid trapId: must be a valid Ethereum address'
      } as VerifyResponse);
    }

    // Get current block number if not provided
    let currentBlockNumber = blockNumber;
    if (!currentBlockNumber) {
      try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
        currentBlockNumber = await provider.getBlockNumber();
      } catch (error) {
        console.error('Error fetching block number:', error);
        return res.status(500).json({
          success: false,
          valid: false,
          message: 'Failed to fetch current block number'
        } as VerifyResponse);
      }
    }

    // Get trap seed from contract
    let trapSeed: string;
    try {
      const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
      const contract = new ethers.Contract(trapId, [
        'function trapSeed() view returns (uint256)'
      ], provider);
      
      const seed = await contract.trapSeed();
      trapSeed = seed.toString();
    } catch (error) {
      console.error('Error fetching trap seed:', error);
      return res.status(500).json({
        success: false,
        valid: false,
        message: 'Failed to fetch trap seed from contract'
      } as VerifyResponse);
    }

    // Compute expected code
    const computedCode = computeCode(trapSeed, currentBlockNumber);
    const isValid = computedCode === code;

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Code is valid' : 'Code is invalid',
      computedCode,
      blockNumber: currentBlockNumber
    } as VerifyResponse);

  } catch (error) {
    console.error('Error in verify endpoint:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Internal server error during verification'
    } as VerifyResponse);
  }
};