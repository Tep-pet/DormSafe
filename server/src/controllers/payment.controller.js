import * as paymentService from '../services/payment.service.js';
import { uploadPaymentReceipt } from '../services/receipt.service.js';
import { success } from '../utils/apiResponse.js';

export async function list(req, res, next) {
  try {
    const propertyId = req.query.propertyId || null;
    const payments = await paymentService.getPaymentsByOwner(req.profile.id, propertyId);
    return success(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const payment = await paymentService.createPayment(req.profile.id, req.body);
    return success(res, payment, 'Payment recorded', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const payment = await paymentService.updatePaymentStatus(
      req.params.id,
      req.profile.id,
      req.body.status
    );
    return success(res, payment, 'Payment updated');
  } catch (err) {
    next(err);
  }
}

export async function uploadReceipt(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('Receipt image required');
      err.status = 400;
      throw err;
    }
    const payment = await uploadPaymentReceipt(req.file, req.params.id, req.profile.id);
    return success(res, payment, 'Receipt uploaded');
  } catch (err) {
    next(err);
  }
}
