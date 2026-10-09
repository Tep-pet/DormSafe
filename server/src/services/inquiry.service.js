import { supabaseAdmin } from '../config/supabase.js';
import { createNotification } from './notification.service.js';
import { sendAccountEmail } from './mail.service.js';

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
    return await createNotification(userId, { ...payload, type: 'room_inquiry' });
  } catch (err) {
    if (!/invalid input value for enum notification_type/i.test(err.message || '')) throw err;
    return createNotification(userId, { ...payload, type: 'room_reserved' });
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
    .select('id, label, property_id, properties(id, name, owner_id, status)')
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

async function ownerEmail(ownerId) {
  const { data } = await supabaseAdmin.from('profiles').select('email, full_name').eq('id', ownerId).maybeSingle();
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
    owner_name: owner.full_name || null,
    owner_email: owner.email || null,
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
        type: 'room_inquiry',
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

  // Send the notification directly to the landlord notifications
  const ownerBody = requestText(metadata, `${studentName} wants to avail a room.`);
  await notify(room.properties.owner_id, {
    title: `New room booking request from ${studentName}`,
    body: ownerBody,
    metadata: { ...metadata, kind: EVENT, inquiry_id: record.id },
  });

  await sendAccountEmail(owner.email, 'DormSafe: student wants to avail a room', ownerBody);

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

  await notify(metadata.owner_id, {
    title: 'Room request updated',
    body,
    metadata: { ...metadata, kind: EVENT, inquiry_id: id },
  });
  const owner = await ownerEmail(metadata.owner_id);
  await sendAccountEmail(owner.email, 'DormSafe: room request updated', body);

  return toInquiry(saved);
}

export async function cancelInquiry(student, id) {
  const row = await loadOwned(id, student.id);
  if (row.metadata.status !== 'pending') {
    throw httpError('Only a pending request can be cancelled', 400);
  }

  const metadata = { ...row.metadata, status: 'cancelled' };
  const body = requestText(metadata, `${metadata.student_name} cancelled their room request.`);
  const saved = await saveRecord(id, metadata, 'Room request cancelled', body);

  await notify(metadata.owner_id, {
    title: 'Room request cancelled',
    body,
    metadata: { ...metadata, kind: EVENT, inquiry_id: id },
  });
  const owner = await ownerEmail(metadata.owner_id);
  await sendAccountEmail(owner.email, 'DormSafe: room request cancelled', body);

  return toInquiry(saved);
}

export async function listOwnerInquiries(ownerId) {
  const { data, error } = await supabaseAdmin
    .from('notifications')
    .select('*')
    .contains('metadata', { kind: KIND, owner_id: ownerId })
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

  if (error) throw error;
  if (!row || row.metadata?.kind !== KIND || row.metadata.owner_id !== owner.id) {
    throw httpError('Request not found', 404);
  }
  if (row.metadata.status !== 'pending') {
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
  await notify(metadata.student_id, {
    title: `Room request ${verb}`,
    body,
    metadata: { ...metadata, kind: EVENT, inquiry_id: id },
  });
  await sendAccountEmail(metadata.student_email, `DormSafe: room request ${verb}`, body);

  return toInquiry(saved);
}
