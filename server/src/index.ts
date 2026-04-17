import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import { connectDB } from './config/db';
import championRoutes from './routes/champions';
import recommendRoutes from './routes/recommend';
import buildRoutes from './routes/build';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT ?? 5000;
const CLIENT_URL = process.env.CLIENT_URL ?? 'http://localhost:5173';

//Security Middleware

app.use(helmet());

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  })
);

//Rate limit: 100 requests per 15 minutes per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  })
);

app.use(express.json({ limit: '10kb' }));

//Health Check

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    ai_provider: process.env.AI_PROVIDER ?? 'ollama',
  });
});

//API Routes

app.use('/api/champions', championRoutes);
app.use('/api/recommend', recommendRoutes);
app.use('/api/build', buildRoutes);

//404 Handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//Global Error Handler
app.use(errorHandler);

//Start Server

const start = async (): Promise<void> => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`DraftSense server running on http://localhost:${PORT}`);
    console.log(`AI provider: ${process.env.AI_PROVIDER ?? 'ollama'}`);
    console.log(`Accepting requests from: ${CLIENT_URL}`);
  });
};

start();
