import { fail } from '../utils/apiResponse.js';

export function errorMiddleware(err, _req, res, _next) {
  console.error('[DormSafe Error]', err);
  const status = err.status || 500;
  fail(res, err.message || 'Internal server error', status);
}
