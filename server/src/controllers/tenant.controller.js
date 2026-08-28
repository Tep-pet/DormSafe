import * as tenantService from '../services/tenant.service.js';
import { success } from '../utils/apiResponse.js';

export async function list(req, res, next) {
  try {
    const propertyId = req.query.propertyId || null;
    const tenants = await tenantService.getTenantsByOwner(req.profile.id, propertyId);
    return success(res, tenants);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const tenant = await tenantService.createTenant(req.profile.id, req.body);
    return success(res, tenant, 'Tenant added', 201);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await tenantService.deleteTenant(req.params.id, req.profile.id);
    return success(res, null, 'Tenant removed');
  } catch (err) {
    next(err);
  }
}
