import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';

const app: Application = express();

// ===========================
// Security Middlewares
// ===========================
app.use(helmet());

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ===========================
// Logging Middleware
// ===========================
if (!config.isTest) {
  app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));
}

// ===========================
// Body Parsing Middlewares
// ===========================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===========================
// Routes
// ===========================
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/students', studentsRouter);
// ... etc.

// ===========================
// 404 Handler
// ===========================
app.use(notFound);

// ===========================
// Global Error Handler
// ===========================
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  errorHandler(err, req, res, next);
});

export default app;
