import app from './app.js';
import { env } from './config/env.js';

if (!process.env.VERCEL) {
  const port = process.env.PORT || env.port || 5000;
  try {
    const server = app.listen(port, '0.0.0.0', () => {
      console.log(`DormSafe server running on port ${port}`);
    });
    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  } catch (err) {
    console.warn('Server listen notice:', err);
  }
}

export default app;

