import { searchNearbyProperties, getPropertyById } from '../services/proximity.service.js';
import { success } from '../utils/apiResponse.js';

export async function search(req, res, next) {
  try {
    const { gate = 'jacinto', minPrice, maxPrice, propertyType } = req.query;
    const result = await searchNearbyProperties({ gate, minPrice, maxPrice, propertyType });
    return success(res, result.properties, 'Properties retrieved');
  } catch (err) {
    next(err);
  }
}

export async function getDetail(req, res, next) {
  try {
    const { id } = req.params;
    const { gate = 'jacinto' } = req.query;
    const property = await getPropertyById(id, gate);
    return success(res, property, 'Property retrieved');
  } catch (err) {
    next(err);
  }
}
