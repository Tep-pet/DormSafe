import { fail } from '../utils/apiResponse.js';

/** Restrict route to one or more roles */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.profile?.role || !roles.includes(req.profile.role)) {
      return fail(res, 'Insufficient permissions', 403);
    }
    next();
  };
}
