-- Notification when a student asks to avail a specific room
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'room_inquiry';
