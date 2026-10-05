import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import authRoutes from './routes/authRoutes.ts';
import complaintRoutes from './routes/complaintRoutes.ts';
import jiraRoutes from './routes/jiraRoutes.ts';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      // Allow local development and same-origin requests
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('run.app')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Root API identification
  app.get('/api', (_req: Request, res: Response) => {
    res.status(200).json({
      name: 'College Complaint Management System API',
      version: '1.0.0',
      status: 'active',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth/*',
        complaints: '/api/complaints/*',
      },
    });
  });

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/complaints', complaintRoutes);
  app.use('/api/jira', jiraRoutes);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
