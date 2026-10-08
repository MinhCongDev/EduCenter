import { config } from './config';
import { connectDB } from './config/database';
import app from './app';

const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start HTTP server
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('  ╔═══════════════════════════════════════╗');
      console.log('  ║         EduCenter API Server          ║');
      console.log('  ╠═══════════════════════════════════════╣');
      console.log(`  ║  🚀 Server  : http://localhost:${config.port}   ║`);
      console.log(`  ║  🌍 Env     : ${config.nodeEnv.padEnd(26)}║`);
      console.log(`  ║  📦 DB      : MongoDB                 ║`);
      console.log(`  ║  ❤️  Health  : /api/health             ║`);
      console.log('  ╚═══════════════════════════════════════╝');
      console.log('');
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (reason: unknown) => {
      console.error('❌ Unhandled Rejection:', reason);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      console.error('❌ Uncaught Exception:', error);
      server.close(() => {
        process.exit(1);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
