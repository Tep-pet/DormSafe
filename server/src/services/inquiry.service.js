import { supabaseAdmin } from '../config/supabase.js';
import { createNotification } from './notification.service.js';
import { sendAccountEmail } from './mail.service.js';
import { resolveOwnerIds } from '../utils/ownership.js';

const KIND = 'room_request';
const EVENT = 'room_request_event';

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertDates(moveIn, moveOut) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveIn || '') || !/^\d{4}-\d{2}-\d{2}$/.test(moveOut || '')) {
    throw httpError('Enter a move-in date and a move-out date', 400);
  }
  if (moveOut < moveIn) {
    throw httpError('Move-out must be on or after move-in', 400);
  }
}

function cleanNote(value, label) {
  const text = String(value || '').trim();
  if (text.length > 500) throw httpError(`${label} must be 500 characters or less`, 400);
  return text;
}

async function notify(userId, payload) {
  try {
    return await createNotification(userId, { ...payload, type: 'room_reserved' });
  } catch (err) {
    console.warn('DormSafe notify warning:', err.message);
    return null;
  }
}

function toInquiry(row) {
  const meta = row.metadata || {};
  return {
    id: row.id,
    status: meta.status,
    property_id: meta.property_id,
    property_name: meta.property_name,
    room_id: meta.room_id,
    room_label: meta.room_label,
    student_id: meta.student_id,
    student_name: meta.student_name,
    student_email: meta.student_email,
    owner_id: meta.owner_id,
    owner_name: meta.owner_name || null,
    owner_email: meta.owner_email || null,
    move_in_date: meta.move_in_date,
    move_out_date: meta.move_out_date,
    note: meta.note || '',
    owner_message: meta.owner_message || '',
    created_at: row.created_at,
  };
}

function requestText(meta, headline) {
  const lines = [
    headline,
    `Room: ${meta.room_label} at ${meta.property_name}`,
    `Move in: ${meta.move_in_date}`,
    `Move out: ${meta.move_out_date}`,
    `Note: ${meta.note || '—'}`,
    `Student: ${meta.student_name}${meta.student_email ? ` (${meta.student_email})` : ''}`,
  ];
  return lines.join('\n');
}

async function loadRoom(propertyId, roomId) {
  const { data: room, error } = await supabaseAdmin
    .from('rooms')
    .select('id, label, property_id, properties(id, name, owner_id, status, description, contact_name, contact_phone)')
    .eq('id', roomId)
    .eq('property_id', propertyId)
    .maybeSingle();

  if (error) throw error;
  if (!room?.properties || room.properties.status !== 'approved') {
    throw httpError('That room is not available to request', 404);
  }
  return room;
}

async function findPending(studentId, roomId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', studentId)
    .contains('metadata', { kind: KIND, room_id: roomId, status: 'pending' })
    .limit(1);

  if (error) throw error;
  return data?.[0] || null;
}

async function loadOwned(id, studentId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', id)
    .eq('user_id', studentId)
    .maybeSingle();

  if (error) throw error;
  if (!data || data.metadata?.kind !== KIND) throw httpError('Request not found', 404);
  return data;
}

async function saveRecord(id, metadata, title, body) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .update({ metadata, title, body })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

const OWNER_PUBLIC_EMAILS = {
  'owner.ivory1104@dormsafe.test': 'blancotwinkle@gmail.com',
  'owner.ivory2004@dormsafe.test': 'rheapalima09@gmail.com',
  'owner.brc@dormsafe.test': 'sgpalima@addu.edu.ph',
  'buildingblocks.davao@gmail.com': 'sgpalima@addu.edu.ph',
  'buildingblocks_davao@yahoo.com.ph': 'sgpalima@addu.edu.ph',
  'w.macguilles@gmail.com': 'lssaguirre@addu.edu.ph',
  'andayamay111@gmail.com': 'lssaguirre@addu.edu.ph',
  'owner.juan@dormsafe.test': 'fmppacatang@addu.edu.ph',
  'jerlyugapay@gmail.com': 'fmppacatang@addu.edu.ph',
};

function resolveLandlordRecipient(property, owner) {
  const propName = (property?.name || '').toLowerCase();
  // Always use fmppacatang@addu.edu.ph for Juan Luna Boarding House
  if (propName.includes('juan luna') || propName.includes('juna')) {
    return 'fmppacatang@addu.edu.ph';
  }
  // BRC Dormitory
  if (propName.includes('brc')) {
    return 'sgpalima@addu.edu.ph';
  }
  // Correla Dormitory
  if (propName.includes('correla')) {
    return 'lssaguirre@addu.edu.ph';
  }
  // Residencia de Maria / Residencia
  if (propName.includes('residencia')) {
    return 'lssaguirre@addu.edu.ph';
  }
  // Check known owner email mapping
  if (owner?.email && OWNER_PUBLIC_EMAILS[owner.email]) {
    return OWNER_PUBLIC_EMAILS[owner.email];
  }
  // Check property description for Email: ...
  const descMatch = property?.description?.match(/Email:\s*([^\s,]+)/i);
  if (descMatch && descMatch[1] && descMatch[1].includes('@') && !descMatch[1].endsWith('@dormsafe.test')) {
    return descMatch[1].trim();
  }
  // Check if owner profile has a deliverable email
  if (owner?.email && !owner.email.endsWith('@dormsafe.test')) {
    return owner.email.trim();
  }
  return owner?.email || null;
}

const KNOWN_DORM_LANDLORDS = {
  'ivory residences room 2004': 'Rhea Palima',
  'ivory 2004': 'Rhea Palima',
  'ivory residences room 1104': 'Twinkle Blanco',
  'ivory 1104': 'Twinkle Blanco',
  'brc dormitory': 'Trisha Paula Gwatwo',
  'juan luna boarding house': 'Jerly Ugapay',
  'juna boarding house': 'Jerly Ugapay',
  'correla dormitory': 'Williamor Corpuz',
  'residencia de maria': 'May Andaya',
  'residencia de maria goretti': 'May Andaya',
};

function resolveLandlordName(property, owner, roomLabel = '') {
  // 1. Check property name + room label match (e.g. Ivory Residences Room 1104 -> Twinkle Blanco)
  const combined = `${property?.name || ''} ${roomLabel || ''}`.toLowerCase().trim();
  for (const [key, name] of Object.entries(KNOWN_DORM_LANDLORDS)) {
    if (combined.includes(key)) {
      return name;
    }
  }

  // 2. Check property name match alone
  const propName = (property?.name || '').toLowerCase().trim();
  for (const [key, name] of Object.entries(KNOWN_DORM_LANDLORDS)) {
    if (propName.includes(key)) {
      return name;
    }
  }

  // 3. Check property.contact_name column
  if (property?.contact_name && property.contact_name.trim()) {
    return property.contact_name.trim();
  }

  // 4. Check owner profile full_name
  if (owner?.full_name && owner.full_name.trim() && owner.full_name !== 'Owner') {
    return owner.full_name.trim();
  }

  // 5. Check description for Contact: ... or Owner: ...
  const contactMatch = property?.description?.match(/(?:Contact|Owner):\s*([^,\n]+)/i);
  if (contactMatch && contactMatch[1] && contactMatch[1].trim()) {
    return contactMatch[1].trim();
  }

  return 'Landlord';
}

function buildInquiryEmail({ landlordName, propertyName, roomLabel, studentName, studentContact, moveIn, moveOut, note, timeSubmitted }) {
  const greeting = landlordName && landlordName !== 'Landlord' ? `Hello ${landlordName},` : 'Hello Landlord,';

  const text = `
${greeting}

You have received a new inquiry on DormSafe for ${propertyName}!

--- INQUIRY DETAILS ---
• Accommodation: ${propertyName} (Unit: ${roomLabel})
• Student Name: ${studentName}
• Student Contact / Email: ${studentContact}
• Move-In Date: ${moveIn}
• Move-Out Date: ${moveOut}
• Student Message / Request: ${note || 'None provided'}
• Time Submitted: ${timeSubmitted}

To review or reply to this inquiry, please log in to your DormSafe Landlord Portal.

Best regards,
DormSafe Team – Ateneo de Davao Student Accommodations Platform
`.trim();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 24px; }
    .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { background: #002B49; color: #ffffff; padding: 28px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 13px; color: #93c5fd; }
    .content { padding: 28px 24px; }
    .greeting { font-size: 15px; margin-bottom: 18px; color: #334155; }
    .card { background: #f8fafc; border-radius: 12px; padding: 18px; margin-bottom: 22px; border: 1px solid #e2e8f0; }
    .message-box { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-top: 6px; font-size: 13px; color: #334155; font-style: italic; }
    .footer { padding: 20px 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fafafa; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Inquiry Received</h1>
      <p>DormSafe Accommodation Notification</p>
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        A student has submitted an inquiry for <strong>${propertyName}</strong>. Here are the details:
      </p>
      
      <div class="card">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Accommodation</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 700; text-align: right;">${propertyName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Unit / Room</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${roomLabel}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Student Name</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${studentName}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Student Contact</td>
            <td style="padding: 8px 0; color: #002B49; font-weight: 600; text-align: right;">${studentContact}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Move-In Date</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${moveIn}</td>
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Move-Out Date</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: 600; text-align: right;">${moveOut}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b; font-weight: 500;">Time Submitted</td>
            <td style="padding: 8px 0; color: #64748b; text-align: right;">${timeSubmitted}</td>
          </tr>
        </table>

        <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #cbd5e1;">
          <span style="font-size: 12px; font-weight: 600; color: #475569;">Student Request / Message:</span>
          <div class="message-box">"${note || 'No additional note provided.'}"</div>
        </div>
      </div>

      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        Log in to your DormSafe Landlord Portal to accept, decline, or reply to this inquiry.
      </p>
    </div>
    <div class="footer">
      DormSafe • Ateneo de Davao University Student Accommodations Platform<br>
      This is an automated notification. Please do not reply directly to this email.
    </div>
  </div>
</body>
</html>
`.trim();

  return { text, html };
}

async function ownerEmail(ownerId) {
  const { data } = await supabaseAdmin.from('profiles').select('email, full_name, phone').eq('id', ownerId).maybeSingle();
  return data || {};
}

export async function requestRoom(student, { property_id, room_id, move_in_date, move_out_date, note }) {
  if (!property_id || !room_id) throw httpError('Choose a room before sending a request', 400);
  assertDates(move_in_date, move_out_date);
  const clean = cleanNote(note, 'Note');

  const room = await loadRoom(property_id, room_id);
  if (room.properties.owner_id === student.id) {
    throw httpError('You cannot request your own listing', 400);
  }

  const existing = await findPending(student.id, room_id);
  if (existing) {
    throw httpError('You already have a pending request for this room. Update it from Requests.', 409);
  }

  const owner = await ownerEmail(room.properties.owner_id);
  const recipientEmail = resolveLandlordRecipient(room.properties, owner);
  const landlordName = resolveLandlordName(room.properties, owner, room.label);
  const studentName = student.full_name || student.email || 'A student';
  const metadata = {
    kind: KIND,
    status: 'pending',
    property_id,
    property_name: room.properties.name,
    room_id,
    room_label: room.label || 'Room',
    student_id: student.id,
    student_name: studentName,
    student_email: student.email || null,
    owner_id: room.properties.owner_id,
    owner_name: landlordName !== 'Landlord' ? landlordName : (owner.full_name || null),
    owner_email: recipientEmail || owner.email || null,
    move_in_date,
    move_out_date,
    note: clean,
    owner_message: '',
  };

  const body = requestText(metadata, `${studentName} wants to avail this room.`);
  
  // Store student request record for inquiries tracking without notifying the student
  let record;
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: student.id,
        type: 'room_reserved',
        title: 'Room request sent',
        body,
        metadata,
        read_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;
    record = data;
  } catch (err) {
    const { data, error: fbError } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: student.id,
        type: 'room_reserved',
        title: 'Room request sent',
        body,
        metadata,
        read_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (fbError) throw fbError;
    record = data;
  }

  // Send the in-app notification directly to the landlord notifications
  const ownerBody = requestText(metadata, `${studentName} wants to avail a room.`);
  try {
    await notify(room.properties.owner_id, {
      title: `New room booking request from ${studentName}`,
      body: ownerBody,
      metadata: { ...metadata, kind: EVENT, inquiry_id: record.id },
    });
  } catch (notifyErr) {
    console.warn('Failed to notify owner in-app:', notifyErr.message);
  }

  // Send Gmail SMTP email notification to landlord
  try {
    if (recipientEmail) {
      const emailSubject = `New Inquiry for ${room.properties.name} – DormSafe`;
      const timeSubmitted = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Manila',
        dateStyle: 'full',
        timeStyle: 'medium',
      });
      const studentContact = student.email
        ? `${student.email}${student.phone ? ` (${student.phone})` : ''}`
        : (student.phone || 'Contact not listed');

      const { text: emailText, html: emailHtml } = buildInquiryEmail({
        landlordName,
        propertyName: room.properties.name,
        roomLabel: room.label || 'Standard Unit',
        studentName,
        studentContact,
        moveIn: move_in_date,
        moveOut: move_out_date,
        note: clean,
        timeSubmitted,
      });

      console.log(`[DormSafe Inquiry] Dispatching inquiry email to landlord (${recipientEmail}) for ${room.properties.name}...`);
      await sendAccountEmail(recipientEmail, emailSubject, emailText, emailHtml);
    } else {
      console.warn(`[DormSafe Inquiry] No landlord email resolved for property "${room.properties.name}". Email notification skipped.`);
    }
  } catch (emailErr) {
    console.warn('[DormSafe Inquiry] Failed to send email to landlord:', emailErr.message);
  }

  return toInquiry(record);
}

export async function listStudentInquiries(studentId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('user_id', studentId)
    .contains('metadata', { kind: KIND })
    .order('created_at', { ascending: false });

  if (error) throw error;
  const list = (data || []).map(toInquiry);

  const missingOwnerIds = [...new Set(list.filter((x) => !x.owner_email && x.owner_id).map((x) => x.owner_id))];
  if (missingOwnerIds.length > 0) {
    const { data: owners } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', missingOwnerIds);
    const ownerMap = new Map((owners || []).map((o) => [o.id, o]));
    for (const item of list) {
      if (!item.owner_email && ownerMap.has(item.owner_id)) {
        const o = ownerMap.get(item.owner_id);
        item.owner_email = o.email;
        if (!item.owner_name) item.owner_name = o.full_name;
      }
    }
  }

  return list;
}

export async function updateInquiry(student, id, { move_in_date, move_out_date, note }) {
  assertDates(move_in_date, move_out_date);
  const clean = cleanNote(note, 'Note');
  const row = await loadOwned(id, student.id);
  if (row.metadata.status !== 'pending') {
    throw httpError('Only a pending request can be changed', 400);
  }

  const metadata = {
    ...row.metadata,
    move_in_date,
    move_out_date,
    note: clean,
  };
  const body = requestText(metadata, `${metadata.student_name} updated their room request.`);
  const saved = await saveRecord(id, metadata, 'Room request updated', body);

  try {
    await notify(metadata.owner_id, {
      title: 'Room request updated',
      body,
      metadata: { ...metadata, kind: EVENT, inquiry_id: id },
    });
  } catch (err) {
    console.warn('Failed to notify owner:', err.message);
  }

  try {
    const owner = await ownerEmail(metadata.owner_id);
    await sendAccountEmail(owner.email, 'DormSafe: room request updated', body);
  } catch (err) {
    console.warn('Failed to send email to owner:', err.message);
  }

  return toInquiry(saved);
}

export async function cancelInquiry(student, id) {
  const row = await loadOwned(id, student.id);
  if (row.metadata.status !== 'pending') {
    if (row.metadata.status === 'cancelled') return toInquiry(row);
    throw httpError('Only a pending request can be cancelled', 400);
  }

  const metadata = { ...row.metadata, status: 'cancelled' };
  const body = requestText(metadata, `${metadata.student_name} cancelled their room request.`);
  const saved = await saveRecord(id, metadata, 'Room request cancelled', body);

  try {
    await notify(metadata.owner_id, {
      title: 'Room request cancelled',
      body,
      metadata: { ...metadata, kind: EVENT, inquiry_id: id },
    });
  } catch (err) {
    console.warn('Failed to notify owner:', err.message);
  }

  try {
    const owner = await ownerEmail(metadata.owner_id);
    await sendAccountEmail(owner.email, 'DormSafe: room request cancelled', body);
  } catch (err) {
    console.warn('Failed to send email to owner:', err.message);
  }

  return toInquiry(saved);
}

export async function listOwnerInquiries(ownerId) {
  const ownerIds = resolveOwnerIds(ownerId);
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('metadata->>kind', KIND)
    .in('metadata->>owner_id', ownerIds)
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rank = { pending: 0, accepted: 1, declined: 2, cancelled: 3 };
  return (data || [])
    .map(toInquiry)
    .sort((a, b) => (rank[a.status] ?? 9) - (rank[b.status] ?? 9));
}

export async function replyToInquiry(owner, id, { status, message }) {
  if (!['accepted', 'declined'].includes(status)) {
    throw httpError('Choose accept or decline', 400);
  }
  const reply = cleanNote(message, 'Message');

  const { data: row, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  const ownerIds = resolveOwnerIds(owner.id);
  if (error) throw error;
  if (!row || row.metadata?.kind !== KIND || !ownerIds.includes(row.metadata.owner_id)) {
    throw httpError('Request not found', 404);
  }
  if (row.metadata.status !== 'pending') {
    if (row.metadata.status === status) {
      return toInquiry(row);
    }
    throw httpError('This request is no longer pending', 400);
  }

  const metadata = { ...row.metadata, status, owner_message: reply };
  const verb = status === 'accepted' ? 'accepted' : 'declined';
  const body = [
    `${owner.full_name || 'The owner'} ${verb} your request for ${metadata.room_label} at ${metadata.property_name}.`,
    `Move in: ${metadata.move_in_date}`,
    `Move out: ${metadata.move_out_date}`,
    reply ? `Message: ${reply}` : '',
  ].filter(Boolean).join('\n');

  const saved = await saveRecord(id, metadata, `Room request ${verb}`, body);

  if (status === 'accepted') {
    await supabaseAdmin
      .from('rooms')
      .update({ is_available: false })
      .eq('id', metadata.room_id);
  }

  try {
    await notify(metadata.student_id, {
      title: `Room request ${verb}`,
      body,
      metadata: { ...metadata, kind: EVENT, inquiry_id: id },
    });
  } catch (err) {
    console.warn('Failed to notify student:', err.message);
  }

  try {
    await sendAccountEmail(metadata.student_email, `DormSafe: room request ${verb}`, body);
  } catch (err) {
    console.warn('Failed to email student:', err.message);
  }

  return toInquiry(saved);
}
