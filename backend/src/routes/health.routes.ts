import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';

export const healthRouter = Router();

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
healthRouter.get('/', (_req: Request, res: Response) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    database: {
      status: dbStatus[dbState] || 'unknown',
      connected: dbState === 1,
    },
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsage: {
        heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
      },
    },
  };

  const httpStatus = dbState === 1 ? 200 : 503;
  res.status(httpStatus).json(status);
});

/**
 * @route   GET /api/health/ping
 * @desc    Simple ping check
 * @access  Public
 */
healthRouter.get('/ping', (_req: Request, res: Response) => {
  res.status(200).json({ message: 'pong', timestamp: new Date().toISOString() });
});
