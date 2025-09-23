import { Request, Response } from 'express';

export const healthEndpoint = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Drosera Authenticator Backend is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  });
};