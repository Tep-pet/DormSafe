import { uploadPermit } from '../services/upload.service.js';
import * as analyticsService from '../services/analytics.service.js';
import * as maintenanceService from '../services/maintenance.service.js';
import * as paymentService from '../services/payment.service.js';
import { success } from '../utils/apiResponse.js';

export async function submitVerification(req, res, next) {
  try {
    if (!req.file) {
      const err = new Error('Permit file required');
      err.status = 400;
      throw err;
    }
    const data = await uploadPermit(req.file, req.profile.id);
    return success(res, data, 'Verification submitted', 201);
  } catch (err) {
    next(err);
  }
}

export async function analytics(req, res, next) {
  try {
    const propertyId = req.query.propertyId || null;
    const data = await analyticsService.getOwnerAnalytics(req.profile.id, propertyId);
    return success(res, data);
  } catch (err) {
    next(err);
  }
}

export async function occupancyCalendar(req, res, next) {
  try {
    const propertyId = req.query.propertyId || null;
    const events = await analyticsService.getOccupancyCalendar(req.profile.id, propertyId);
    return success(res, events);
  } catch (err) {
    next(err);
  }
}

export async function sendPaymentReminders(req, res, next) {
  try {
    const result = await paymentService.sendPaymentReminders(req.profile.id);
    return success(res, result, `Sent ${result.sent} reminder(s)`);
  } catch (err) {
    next(err);
  }
}

export async function listMaintenance(req, res, next) {
  try {
    const requests = await maintenanceService.getOwnerMaintenanceRequests(req.profile.id);
    return success(res, requests);
  } catch (err) {
    next(err);
  }
}

export async function updateMaintenance(req, res, next) {
  try {
    const request = await maintenanceService.updateMaintenanceStatus(
      req.params.id,
      req.profile.id,
      req.body.status
    );
    return success(res, request, 'Request updated');
  } catch (err) {
    next(err);
  }
}
