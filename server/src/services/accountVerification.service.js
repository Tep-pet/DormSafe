import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../config/supabase.js';
import { notifyAdmins, createNotification } from './notification.service.js';

const BUCKET = 'verification-docs';

function extFromFile(file) {
  const raw = (file.originalname?.split('.').pop() || 'jpg').toLowerCase();
  return ['jpg', 'jpeg', 'png', 'webp'].includes(raw) ? raw : 'jpg';
}

async function uploadDoc(file, userId, label) {
  const path = `${userId}/${label}-${randomUUID()}.${extFromFile(file)}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
  if (error) throw error;
  return path;
}

export async function createAccountVerification(userId, { idFile, licenseFile, role }) {
  const idPath = await uploadDoc(idFile, userId, 'id');
  let licensePath = null;
  if (role === 'owner') {
    if (!licenseFile) {
      const err = new Error('Business license/permit image is required for owners');
      err.status = 400;
      throw err;
    }
    licensePath = await uploadDoc(licenseFile, userId, 'license');
  }

  const { data, error } = await supabaseAdmin
    .from('account_verifications')
    .insert({
      user_id: userId,
      id_storage_path: idPath,
      license_storage_path: licensePath,
      status: 'pending',
    })
    .select()
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from('profiles')
    .update({ verification_status: 'pending', updated_at: new Date().toISOString() })
    .eq('id', userId);

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single();

  await notifyAdmins({
    type: 'account_submitted',
    title: `New ${profile?.role || 'user'} application`,
    body: `${profile?.full_name || 'A user'} submitted ID documents for review.`,
    metadata: { verification_id: data.id, user_id: userId, role: profile?.role },
  });

  return data;
}

export async function getMyVerificationStatus(userId) {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('verification_status, role')
    .eq('id', userId)
    .single();

  const { data: latest } = await supabaseAdmin
    .from('account_verifications')
    .select('id, status, notes, created_at, reviewed_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return { verification_status: profile?.verification_status, latest };
}

export async function resubmitVerification(userId, role, { idFile, licenseFile }) {
  const { data: pending } = await supabaseAdmin
    .from('account_verifications')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (pending) {
    const err = new Error('You already have a pending verification');
    err.status = 409;
    throw err;
  }

  return createAccountVerification(userId, { idFile, licenseFile, role });
}

export async function getAccountVerifications(filters = {}) {
  const {
    status = 'pending',
    page = 1,
    limit = 5,
    sort = 'desc',
    dateFrom,
    dateTo,
    role,
  } = filters;

  const from = (Math.max(1, page) - 1) * limit;
  const to = from + limit - 1;

  let query = supabaseAdmin
    .from('account_verifications')
    .select(
      `
      id, id_storage_path, license_storage_path, status, notes, created_at, reviewed_at,
      profiles!account_verifications_user_id_fkey(id, full_name, email, role, verification_status)
    `,
      { count: 'exact' }
    );

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (dateFrom) query = query.gte('created_at', dateFrom);
  if (dateTo) query = query.lte('created_at', `${dateTo}T23:59:59.999Z`);

  if (role) {
    const { data: roleUsers } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', role);
    const ids = (roleUsers || []).map((u) => u.id);
    if (!ids.length) {
      return { items: [], total: 0, page: Math.max(1, page), limit, totalPages: 1 };
    }
    query = query.in('user_id', ids);
  }

  query = query
    .order('created_at', { ascending: sort === 'asc' })
    .range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    items: data || [],
    total: count || 0,
    page: Math.max(1, page),
    limit,
    totalPages: Math.ceil((count || 0) / limit) || 1,
  };
}

export async function reviewAccountVerification(verificationId, adminId, { status, notes }) {
  const { data: verification, error } = await supabaseAdmin
    .from('account_verifications')
    .update({
      status,
      notes: notes || null,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', verificationId)
    .select(`*, profiles!account_verifications_user_id_fkey(id, full_name, role)`)
    .single();

  if (error) throw error;

  await supabaseAdmin
    .from('profiles')
    .update({ verification_status: status, updated_at: new Date().toISOString() })
    .eq('id', verification.user_id);

  const approved = status === 'approved';
  await createNotification(verification.user_id, {
    type: 'account_reviewed',
    title: approved ? 'Account approved' : 'Account not approved',
    body: approved
      ? 'Your ID verification was approved. You can now use DormSafe.'
      : `Your verification was rejected.${notes ? ` Reason: ${notes}` : ''}`,
    metadata: { verification_id: verificationId, status },
  });

  return verification;
}

export async function getSignedDocumentUrl(storagePath, expiresIn = 3600) {
  if (!storagePath) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}

export async function getVerificationDocuments(verificationId) {
  const { data, error } = await supabaseAdmin
    .from('account_verifications')
    .select('id_storage_path, license_storage_path')
    .eq('id', verificationId)
    .single();

  if (error || !data) {
    const err = new Error('Verification not found');
    err.status = 404;
    throw err;
  }

  return {
    id_url: await getSignedDocumentUrl(data.id_storage_path),
    license_url: data.license_storage_path
      ? await getSignedDocumentUrl(data.license_storage_path)
      : null,
  };
}

export async function getOwnerVerificationForProperty(ownerId) {
  const { data } = await supabaseAdmin
    .from('account_verifications')
    .select('id, id_storage_path, license_storage_path, status, created_at')
    .eq('user_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    id_url: await getSignedDocumentUrl(data.id_storage_path),
    license_url: data.license_storage_path
      ? await getSignedDocumentUrl(data.license_storage_path)
      : null,
  };
}

export async function getAdminDashboardStats(adminId) {
  const [accounts, listings, myReviews] = await Promise.all([
    supabaseAdmin.from('account_verifications').select('status'),
    supabaseAdmin.from('properties').select('status'),
    supabaseAdmin
      .from('account_verifications')
      .select('status')
      .eq('reviewed_by', adminId),
  ]);

  const countByStatus = (rows, field = 'status') =>
    (rows.data || []).reduce((acc, row) => {
      acc[row[field]] = (acc[row[field]] || 0) + 1;
      return acc;
    }, {});

  const accountCounts = countByStatus(accounts);
  const listingCounts = countByStatus(listings);

  const myApproved = (myReviews.data || []).filter((r) => r.status === 'approved').length;
  const myRejected = (myReviews.data || []).filter((r) => r.status === 'rejected').length;

  return {
    accounts: {
      pending: accountCounts.pending || 0,
      approved: accountCounts.approved || 0,
      rejected: accountCounts.rejected || 0,
    },
    listings: {
      pending: listingCounts.pending || 0,
      approved: listingCounts.approved || 0,
      rejected: listingCounts.rejected || 0,
    },
    myReviews: { approved: myApproved, rejected: myRejected },
  };
}
