import mongoose from 'mongoose';
import { config } from './index';
import dns from 'dns';

// Force Node to use public DNS servers BEFORE any mongoose.connect call,
// so MongoDB Atlas SRV lookups (_mongodb._tcp.<cluster>.mongodb.net) are not
// blocked by the local ISP DNS resolver.
const dnsServers = (process.env.MONGODB_DNS_SERVERS || '8.8.8.8,1.1.1.1')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (dnsServers.length > 0) {
  dns.setServers(dnsServers);
  // eslint-disable-next-line no-console
  console.log(`[DB] DNS servers forced: ${dnsServers.join(', ')}`);
}

let isConnected = false;

const connectWithRetry = async (uri: string, attempts = 3): Promise<typeof mongoose> => {
  let lastErr: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      // eslint-disable-next-line no-console
      console.log(`[DB] Connecting to MongoDB (attempt ${i}/${attempts})...`);
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        // Recommended options for Mongoose 8+
      });
      return conn;
    } catch (err) {
      lastErr = err;
      // eslint-disable-next-line no-console
      console.error(`[DB] Attempt ${i} failed:`, (err as Error).message);
      if (i < attempts) {
        // Wait 2s before retry so DNS can settle
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }
  throw lastErr;
};

export const connectDB = async (): Promise<void> => {
  if (isConnected) {
    // eslint-disable-next-line no-console
    console.log('[DB] MongoDB already connected');
    return;
  }

  try {
    const conn = await connectWithRetry(config.mongodbUri, 3);

    isConnected = true;
    // eslint-disable-next-line no-console
    console.log(`[DB] MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      // eslint-disable-next-line no-console
      console.error('[DB] MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      // eslint-disable-next-line no-console
      console.warn('[DB] MongoDB disconnected');
      isConnected = false;
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      // eslint-disable-next-line no-console
      console.log('[DB] MongoDB connection closed (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      // eslint-disable-next-line no-console
      console.log('[DB] MongoDB connection closed (SIGTERM)');
      process.exit(0);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[DB] MongoDB connection failed after retries:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  if (!isConnected) return;
  await mongoose.connection.close();
  isConnected = false;
  // eslint-disable-next-line no-console
  console.log('[DB] MongoDB disconnected');
};
