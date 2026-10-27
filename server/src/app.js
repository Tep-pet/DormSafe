import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

function isAllowedOrigin(origin) {
  if (!origin || env.corsOrigin === '*' || origin === env.corsOrigin) return true;
  try {
    const url = new URL(origin);
    const isLocalhost =
      (url.protocol === 'http:' || url.protocol === 'https:') &&
      (url.hostname === 'localhost' ||
        url.hostname === '127.0.0.1' ||
        url.hostname === '[::1]' ||
        url.hostname === '::1');
    const isVercel =
      url.protocol === 'https:' &&
      (url.hostname.endsWith('.vercel.app') ||
        url.hostname === 'vercel.app' ||
        url.hostname.endsWith('.tmp.now') ||
        url.hostname.endsWith('.now.sh'));
    return isLocalhost || isVercel;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'DormSafe API' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'DormSafe API' }));

app.use('/api', apiRoutes);
app.use('/', apiRoutes);

app.use(errorMiddleware);

export default app;
