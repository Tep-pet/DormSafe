-- Student stays, room reservations, extended notifications

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled');

CREATE TABLE IF NOT EXISTS room_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reserved_start_date DATE NOT NULL,
  status reservation_status NOT NULL DEFAULT 'pending',
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_room_reservations_room ON room_reservations(room_id);
CREATE INDEX IF NOT EXISTS idx_room_reservations_student ON room_reservations(student_id);
CREATE INDEX IF NOT EXISTS idx_tenants_student ON tenants(student_id);
CREATE INDEX IF NOT EXISTS idx_tenants_room ON tenants(room_id);

ALTER TABLE room_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own reservations"
  ON room_reservations FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Students create reservations"
  ON room_reservations FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Admins manage reservations"
  ON room_reservations FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'stay_ending_soon';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'reservation_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'rerent_requested';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'room_reserved';
