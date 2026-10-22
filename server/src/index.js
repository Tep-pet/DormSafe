import app from './app.js';
import { env } from './config/env.js';

if (!process.env.VERCEL) {
  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(`DormSafe server running on http://localhost:${env.port}`);
  });

  // Prevent Node.js from closing idle keep-alive sockets before the browser does.
  // Node defaults to 5000ms (5s), which causes ECONNRESET and "Failed to fetch"
  // in Chrome/Edge when users take >5 seconds before clicking confirm/submit.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
}

export default app;

