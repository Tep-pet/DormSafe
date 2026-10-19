import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorMiddleware } from './middleware/error.middleware.js';

const app = express();

function isAllowedOrigin(origin) {
  if (!origin || origin === env.corsOrigin) return true;
  try {
    const url = new URL(origin);
    return url.protocol === 'http:' && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
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
  })
);
app.use(express.json());

app.use('/api', apiRoutes);

app.use(errorMiddleware);

export default app;
