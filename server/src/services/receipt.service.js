import { supabaseAdmin } from '../config/supabase.js';
import { assertPaymentOwnedBy } from '../utils/ownership.js';

export async function uploadPaymentReceipt(file, paymentId, ownerId) {
  await assertPaymentOwnedBy(paymentId, ownerId);

  const ext = file.originalname.split('.').pop() || 'jpg';
  const path = `${ownerId}/${paymentId}/receipt-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabaseAdmin.storage
    .from('receipts')
    .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

  if (uploadError) throw uploadError;

  const { data, error } = await supabaseAdmin
    .from('payments')
    .update({
      receipt_storage_path: path,
      status: 'paid',
      paid_date: new Date().toISOString().slice(0, 10),
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSignedReceiptUrl(storagePath, expiresIn = 3600) {
  if (!storagePath) return null;
  const { data, error } = await supabaseAdmin.storage
    .from('receipts')
    .createSignedUrl(storagePath, expiresIn);
  if (error) return null;
  return data.signedUrl;
}
