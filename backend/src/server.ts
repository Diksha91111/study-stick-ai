import express, { Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ENV } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import sleepRoutes from './routes/sleepRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import examRoutes from './routes/examRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import executionRoutes from './routes/executionRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import learningPathRoutes from './routes/learningPathRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
import plannerRoutes from './routes/plannerRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import knowledgeGraphRoutes from './routes/knowledgeGraphRoutes.js';
import studyRoomRoutes from './routes/studyRoomRoutes.js';
import { notificationScheduler } from './services/notifications/notificationScheduler.js';

const app = express();

const allowedOrigins = [
  ENV.CLIENT_URL,
  ENV.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5000',
  'http://127.0.0.1:5000',
].filter(Boolean).map(o => o.replace(/\/$/, ''));

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Study Stick AI Backend',
    phase: 1,
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/execution', executionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/learning-path', learningPathRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/knowledge-graph', knowledgeGraphRoutes);
app.use('/api/study-rooms', studyRoomRoutes);

// Error handling middleware
app.use(errorHandler);

// Start server only when executed directly as entrypoint, not when imported by tests
const isMainModule =
  process.env.NODE_ENV !== 'test_runner' &&
  process.env.NODE_ENV !== 'test' &&
  Boolean(
    process.argv[1] &&
      (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'))
  );

if (isMainModule) {
  connectDB().finally(() => {
    app.listen(ENV.PORT, () => {
      console.log(
        `🚀 [Study Stick AI Backend] Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`
      );
      notificationScheduler.start();
    });
  });
}

export default app;
