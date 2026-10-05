import { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.ts';

export class AppError extends Error {
  public statusCode: number;
  public code: string;

  constructor(message: string, statusCode = 400, code = 'BAD_REQUEST') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status ? Number(err.status) : 500);
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected internal error occurred';

  // Do not expose stack trace in production
  const responsePayload: {
    success: boolean;
    error: {
      code: string;
      message: string;
      stack?: string;
    };
  } = {
    success: false,
    error: {
      code,
      message,
    },
  };

  if (config.nodeEnv === 'development' && statusCode === 500 && err.stack) {
    responsePayload.error.stack = err.stack;
  }

  res.status(statusCode).json(responsePayload);
}
