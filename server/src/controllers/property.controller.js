import * as propertyService from '../services/property.service.js';
import { uploadRoomImages } from '../services/upload.service.js';
import { success } from '../utils/apiResponse.js';

export async function create(req, res, next) {
  try {
    if (req.profile.verification_status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Your account must be verified before adding properties',
      });
    }
    const property = await propertyService.createProperty(req.profile.id, req.body);
    return success(res, property, 'Property submitted for approval', 201);
  } catch (err) {
    next(err);
  }
}

export async function listMine(req, res, next) {
  try {
    const properties = await propertyService.getOwnerProperties(req.profile.id);
    return success(res, properties);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const property = await propertyService.getPropertyById(req.params.id, req.profile.id, req.profile.role);
    return success(res, property);
  } catch (err) {
    next(err);
  }
}

export async function uploadRoomPhotos(req, res, next) {
  try {
    if (!req.files?.length) {
      return res.status(400).json({ success: false, message: 'No images provided' });
    }
    const images = await uploadRoomImages(req.files, req.params.roomId, req.profile.id);
    return success(res, images, 'Room photos uploaded', 201);
  } catch (err) {
    next(err);
  }
}

export async function updateAvailability(req, res, next) {
  try {
    const { is_available } = req.body;
    const room = await propertyService.updateRoomAvailability(
      req.params.roomId,
      req.profile.id,
      is_available
    );
    return success(res, room, 'Availability updated');
  } catch (err) {
    next(err);
  }
}

export async function dashboardStats(req, res, next) {
  try {
    const propertyId = req.query.propertyId || null;
    const stats = await propertyService.getOwnerDashboardStats(req.profile.id, propertyId);
    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const property = await propertyService.updateProperty(req.profile.id, req.params.id, req.body);
    return success(res, property, 'Listing updated');
  } catch (err) {
    next(err);
  }
}
