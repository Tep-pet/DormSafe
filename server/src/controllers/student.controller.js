import * as stayService from '../services/stay.service.js';
import * as favoriteService from '../services/favorite.service.js';
import * as reviewService from '../services/review.service.js';
import * as reportService from '../services/report.service.js';
import * as maintenanceService from '../services/maintenance.service.js';
import * as paymentService from '../services/payment.service.js';
import { success } from '../utils/apiResponse.js';

export async function myStays(req, res, next) {
  try {
    const stays = await stayService.getStudentStays(req.profile.id);
    return success(res, stays);
  } catch (err) {
    next(err);
  }
}

export async function myReservations(req, res, next) {
  try {
    const list = await stayService.getStudentReservations(req.profile.id);
    return success(res, list);
  } catch (err) {
    next(err);
  }
}

export async function createReservation(req, res, next) {
  try {
    const reservation = await stayService.createReservation(req.profile.id, req.body);
    return success(res, reservation, 'Room reserved', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateMoveOut(req, res, next) {
  try {
    const stay = await stayService.updateStudentMoveOut(
      req.profile.id,
      req.params.id,
      req.body.move_out_date
    );
    return success(res, stay, 'Move-out date updated');
  } catch (err) {
    next(err);
  }
}

export async function updateReservation(req, res, next) {
  try {
    const reservation = await stayService.updateReservation(
      req.profile.id,
      req.params.id,
      req.body
    );
    return success(res, reservation, 'Reservation updated');
  } catch (err) {
    next(err);
  }
}

export async function rerent(req, res, next) {
  try {
    const stay = await stayService.requestRerent(req.profile.id, req.params.id, req.body);
    return success(res, stay, 'Stay extended');
  } catch (err) {
    next(err);
  }
}

export async function toggleFavorite(req, res, next) {
  try {
    const result = await favoriteService.toggleFavorite(req.profile.id, req.params.propertyId);
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function listFavorites(req, res, next) {
  try {
    const gate = req.query.gate || 'jacinto';
    const items = await favoriteService.getFavorites(req.profile.id, gate);
    return success(res, items);
  } catch (err) {
    next(err);
  }
}

export async function createReview(req, res, next) {
  try {
    const review = await reviewService.createReview(req.profile.id, req.body);
    return success(res, review, 'Review submitted for moderation', 201);
  } catch (err) {
    next(err);
  }
}

export async function reportListing(req, res, next) {
  try {
    const report = await reportService.reportListing(req.profile.id, req.body);
    return success(res, report, 'Report submitted', 201);
  } catch (err) {
    next(err);
  }
}

export async function confirmMoveOut(req, res, next) {
  try {
    const stay = await stayService.confirmMoveOut(req.profile.id, req.params.id);
    return success(res, stay, 'Move-out confirmed');
  } catch (err) {
    next(err);
  }
}

export async function disputeMoveOut(req, res, next) {
  try {
    const stay = await stayService.disputeMoveOut(req.profile.id, req.params.id, req.body.reason);
    return success(res, stay, 'Dispute submitted');
  } catch (err) {
    next(err);
  }
}

export async function leaseSummary(req, res, next) {
  try {
    const summary = await stayService.getLeaseSummary(req.profile.id, req.params.id);
    return success(res, summary);
  } catch (err) {
    next(err);
  }
}

export async function myPayments(req, res, next) {
  try {
    const payments = await paymentService.getStudentPayments(req.profile.id);
    return success(res, payments);
  } catch (err) {
    next(err);
  }
}

export async function createMaintenance(req, res, next) {
  try {
    const request = await maintenanceService.createMaintenanceRequest(req.profile.id, req.body);
    return success(res, request, 'Maintenance request sent', 201);
  } catch (err) {
    next(err);
  }
}

export async function listMaintenance(req, res, next) {
  try {
    const requests = await maintenanceService.getStudentMaintenanceRequests(req.profile.id);
    return success(res, requests);
  } catch (err) {
    next(err);
  }
}
