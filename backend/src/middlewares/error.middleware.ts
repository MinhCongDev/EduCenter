import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: unknown;
}

/**
 * Global error handling middleware.
 * Must be registered last, after all routes.
 */
export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error details (server-side only)
  if (statusCode >= 500) {
    console.error('❌ Server Error:', {
      message: err.message,
      stack: err.stack,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    // Only expose stack trace in development
    ...(isProduction ? {} : { stack: err.stack }),
    // Include field-level validation errors if present
    ...(err.errors ? { errors: err.errors } : {}),
  });
};

/**
 * Creates a standardized operational error.
 */
export const createError = (message: string, statusCode: number, errors?: unknown): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  if (errors !== undefined) {
    error.errors = errors;
  }
  return error;
};
