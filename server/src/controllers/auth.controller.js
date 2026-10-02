import * as authService from '../services/auth.service.js';
import { success } from '../utils/apiResponse.js';

export async function register(req, res, next) {
  try {
    const { fullName, email, password, role } = req.body;
    const idFile = req.files?.idDocument?.[0];
    const licenseFile = req.files?.licenseDocument?.[0];

    const result = await authService.registerUser({
      fullName,
      email,
      password,
      role,
      idFile,
      licenseFile,
    });

    return success(
      res,
      result,
      'Account created. Sign in after admin approves your ID verification.',
      201
    );
  } catch (err) {
    next(err);
  }
}

export async function getVerificationStatus(req, res, next) {
  try {
    const { getMyVerificationStatus } = await import('../services/accountVerification.service.js');
    const status = await getMyVerificationStatus(req.profile.id);
    return success(res, status);
  } catch (err) {
    next(err);
  }
}

export async function resubmitVerification(req, res, next) {
  try {
    const { resubmitVerification } = await import('../services/accountVerification.service.js');
    const idFile = req.files?.idDocument?.[0];
    const licenseFile = req.files?.licenseDocument?.[0];
    const result = await resubmitVerification(req.profile.id, req.profile.role, {
      idFile,
      licenseFile,
    });
    return success(res, result, 'Verification resubmitted', 201);
  } catch (err) {
    next(err);
  }
}
