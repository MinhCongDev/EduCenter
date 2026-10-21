import dotenv from 'dotenv';

// Load environment variables first
dotenv.config();

const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'] as const;

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const config = {
  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // MongoDB
  mongodbUri: process.env.MONGODB_URI as string,

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET as string,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET as string,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Frontend / email verification
  frontendUrl: process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
  verifyEmailUrl:
    process.env.VERIFY_EMAIL_URL ||
    `${process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:5173'}/verify-email`,

  // SMTP (optional in development – email content is logged when unset)
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || '"EduCenter" <no-reply@educenter.edu.vn>',
  },
  isSmtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),

  // Google OAuth (Sign in with Google)
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  isGoogleConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  // Payment Gateway
  paymentGateway: {
    url: process.env.PAYMENT_GATEWAY_URL || 'http://localhost:5001/mock-gateway',
    secret: process.env.PAYMENT_GATEWAY_SECRET || 'mock_payment_secret',
  },
} as const;
