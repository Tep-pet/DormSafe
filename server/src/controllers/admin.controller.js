import * as propertyService from '../services/property.service.js';
import * as accountVerificationService from '../services/accountVerification.service.js';
import * as verificationService from '../services/verification.service.js';
import * as tenantService from '../services/tenant.service.js';
import * as auditService from '../services/audit.service.js';
import * as reviewService from '../services/review.service.js';
import * as reportService from '../services/report.service.js';
import * as systemHealthService from '../services/systemHealth.service.js';
import * as campusStatsService from '../services/campusStats.service.js';
import { supabaseAdmin } from '../config/supabase.js';
import { success } from '../utils/apiResponse.js';

function parseListFilters(query) {
  return {
    page: Number(query.page) || 1,
    limit: Number(query.limit) || 5,
    sort: query.sort === 'asc' ? 'asc' : 'desc',
    propertyId: query.propertyId || null,
    dateFrom: query.dateFrom || null,
    dateTo: query.dateTo || null,
    status: query.status || 'pending',
    role: query.role || null,
  };
}

export async function dashboardStats(req, res, next) {
  try {
    const stats = await accountVerificationService.getAdminDashboardStats(req.profile.id);
    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function pendingListings(req, res, next) {
  try {
    const result = await propertyService.getAdminListings(parseListFilters(req.query));
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function allProperties(req, res, next) {
  try {
    const properties = await propertyService.getAllPropertyNames();
    return success(res, properties);
  } catch (err) {
    next(err);
  }
}

export async function listingDocuments(req, res, next) {
  try {
    const property = await propertyService.getPropertyById(
      req.params.id,
      req.profile.id,
      'admin'
    );
    const [ownerDocs, ownerResult] = await Promise.all([
      accountVerificationService.getOwnerVerificationForProperty(property.owner_id),
      supabaseAdmin.from('profiles').select('full_name, email').eq('id', property.owner_id).single(),
    ]);
    return success(res, { property, ownerDocs, owner: ownerResult.data });
  } catch (err) {
    next(err);
  }
}

export async function approveListing(req, res, next) {
  try {
    const property = await propertyService.updatePropertyStatus(
      req.params.id,
      'approved',
      true,
      req.profile.id
    );
    await auditService.logAudit(req.profile.id, 'approve', 'listing', req.params.id, {
      name: property.name,
    });
    return success(res, property, 'Listing approved');
  } catch (err) {
    next(err);
  }
}

export async function rejectListing(req, res, next) {
  try {
    const property = await propertyService.updatePropertyStatus(
      req.params.id,
      'rejected',
      false,
      req.profile.id
    );
    await auditService.logAudit(req.profile.id, 'reject', 'listing', req.params.id, {
      name: property.name,
    });
    return success(res, property, 'Listing rejected');
  } catch (err) {
    next(err);
  }
}

export async function removeListing(req, res, next) {
  try {
    const property = await propertyService.updatePropertyStatus(req.params.id, 'removed', false);
    return success(res, property, 'Listing removed');
  } catch (err) {
    next(err);
  }
}

export async function pendingVerifications(req, res, next) {
  try {
    const list = await verificationService.getPendingVerifications();
    return success(res, list);
  } catch (err) {
    next(err);
  }
}

export async function accountVerifications(req, res, next) {
  try {
    const result = await accountVerificationService.getAccountVerifications(
      parseListFilters(req.query)
    );
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function verificationDocuments(req, res, next) {
  try {
    const docs = await accountVerificationService.getVerificationDocuments(req.params.id);
    return success(res, docs);
  } catch (err) {
    next(err);
  }
}

export async function reviewVerification(req, res, next) {
  try {
    const result = await verificationService.reviewVerification(
      req.params.id,
      req.profile.id,
      req.body
    );
    return success(res, result, 'Verification reviewed');
  } catch (err) {
    next(err);
  }
}

export async function reviewAccountVerification(req, res, next) {
  try {
    const result = await accountVerificationService.reviewAccountVerification(
      req.params.id,
      req.profile.id,
      req.body
    );
    await auditService.logAudit(req.profile.id, req.body.status, 'account', req.params.id, {
      notes: req.body.notes,
    });
    return success(res, result, 'Account reviewed');
  } catch (err) {
    next(err);
  }
}

export async function listUsers(req, res, next) {
  try {
    const users = await verificationService.getAllUsers();
    return success(res, users);
  } catch (err) {
    next(err);
  }
}

export async function listTenants(req, res, next) {
  try {
    const tenants = await tenantService.getAllTenants();
    return success(res, tenants);
  } catch (err) {
    next(err);
  }
}

export async function removeTenant(req, res, next) {
  try {
    await tenantService.deleteTenantAsAdmin(req.params.id);
    return success(res, null, 'Tenant removed');
  } catch (err) {
    next(err);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const user = await verificationService.updateUserRole(req.params.id, req.body.role);
    return success(res, user, 'User role updated');
  } catch (err) {
    next(err);
  }
}

export async function reviewUserAccount(req, res, next) {
  try {
    const { status, notes } = req.body;
    const { data: latest } = await supabaseAdmin
      .from('account_verifications')
      .select('id')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!latest?.id) {
      return res.status(404).json({ success: false, message: 'No verification found for user' });
    }

    const result = await accountVerificationService.reviewAccountVerification(
      latest.id,
      req.profile.id,
      { status, notes }
    );
    await auditService.logAudit(req.profile.id, status, 'account', req.params.id, { notes });
    return success(res, result, 'User account reviewed');
  } catch (err) {
    next(err);
  }
}

export async function bulkListings(req, res, next) {
  try {
    const { ids = [], action } = req.body;
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ success: false, message: 'ids array required' });
    }
    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'action must be approve or reject' });
    }

    const results = [];
    for (const id of ids) {
      const property = await propertyService.updatePropertyStatus(
        id,
        action === 'approve' ? 'approved' : 'rejected',
        action === 'approve',
        req.profile.id
      );
      await auditService.logAudit(req.profile.id, action, 'listing', id, {
        name: property.name,
        bulk: true,
      });
      results.push(property);
    }
    return success(res, { count: results.length, items: results }, `Bulk ${action} complete`);
  } catch (err) {
    next(err);
  }
}

export async function bulkAccounts(req, res, next) {
  try {
    const { ids = [], status, notes } = req.body;
    if (!Array.isArray(ids) || !ids.length || !status) {
      return res.status(400).json({ success: false, message: 'ids and status required' });
    }

    let count = 0;
    for (const userId of ids) {
      const { data: latest } = await supabaseAdmin
        .from('account_verifications')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!latest?.id) continue;

      await accountVerificationService.reviewAccountVerification(latest.id, req.profile.id, {
        status,
        notes,
      });
      await auditService.logAudit(req.profile.id, status, 'account', userId, { notes, bulk: true });
      count++;
    }
    return success(res, { count }, 'Bulk account review complete');
  } catch (err) {
    next(err);
  }
}

export async function auditLogs(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await auditService.getAuditLogs({ page, limit });
    return success(res, result);
  } catch (err) {
    next(err);
  }
}

export async function systemHealth(req, res, next) {
  try {
    const health = await systemHealthService.getSystemHealth();
    return success(res, health);
  } catch (err) {
    next(err);
  }
}

export async function campusStats(req, res, next) {
  try {
    const stats = await campusStatsService.getCampusStats();
    return success(res, stats);
  } catch (err) {
    next(err);
  }
}

export async function pendingReviews(req, res, next) {
  try {
    const reviews = await reviewService.getPendingReviews();
    return success(res, reviews);
  } catch (err) {
    next(err);
  }
}

export async function moderateReview(req, res, next) {
  try {
    const review = await reviewService.moderateReview(
      req.params.id,
      req.profile.id,
      req.body.status
    );
    return success(res, review, 'Review moderated');
  } catch (err) {
    next(err);
  }
}

export async function pendingReports(req, res, next) {
  try {
    const reports = await reportService.getPendingReports();
    return success(res, reports);
  } catch (err) {
    next(err);
  }
}

export async function dismissReport(req, res, next) {
  try {
    const report = await reportService.dismissReport(req.params.id, req.profile.id);
    await auditService.logAudit(req.profile.id, 'dismiss_report', 'listing_report', req.params.id, {});
    return success(res, report, 'Report reviewed');
  } catch (err) {
    next(err);
  }
}
