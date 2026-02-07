import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './auth/routes';
import userRoutes from './users/routes';
import courseRoutes from './courses/routes';
import lessonRoutes from './lessons/routes';
// import fileRoutes from './files/routes';
// import chatRoutes from './chat/routes';
// import progressRoutes from './progress/routes';
import { errorHandler } from './middleware/errorHandler';
import { initializeBucket } from './utils/minio';
import { connectDatabase } from './utils/prisma';
import { connectRedis } from './utils/redis';
import { createDefaultAdmin } from './auth/controller';

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
// app.use('/api/files', fileRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/progress', progressRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize services and start server
async function startServer() {
  try {
    await connectDatabase();
    await connectRedis();
    await initializeBucket();
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
