import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { healthRouter } from './routes/health.routes';
import { authRouter } from './routes/auth.routes';
import { centerRouter } from './routes/center.routes';
import { courseRouter } from './routes/course.routes';
import { announcementRouter } from './routes/announcement.routes';
import { classRouter } from './routes/class.routes';
import { teacherRouter } from './routes/teacher.routes';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/notFound.middleware';

const app: Application = express();

// ===========================
// Security Middlewares
// ===========================
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
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
app.use('/api/center', centerRouter);
app.use('/api/courses', courseRouter);
app.use('/api/announcements', announcementRouter);
app.use('/api/classes', classRouter);
app.use('/api/teacher', teacherRouter);

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
