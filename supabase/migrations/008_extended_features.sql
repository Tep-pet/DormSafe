-- Favorites, reviews, reports, audit log, maintenance, stay confirmation

CREATE TABLE IF NOT EXISTS saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, property_id)
);

CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE report_status AS ENUM ('pending', 'reviewed', 'dismissed');
CREATE TYPE maintenance_status AS ENUM ('open', 'in_progress', 'resolved');

CREATE TABLE IF NOT EXISTS property_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS move_out_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS move_out_dispute_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_saved_listings_student ON saved_listings(student_id);
CREATE INDEX IF NOT EXISTS idx_property_reviews_property ON property_reviews(property_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listing_reports_status ON listing_reports(status);

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'payment_due';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'maintenance_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'stay_confirm_request';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'stay_disputed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'tenant_invite';

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students manage own favorites"
  ON saved_listings FOR ALL
  USING (auth.uid() = student_id);

CREATE POLICY "Public read approved reviews"
  ON property_reviews FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Students create reviews"
  ON property_reviews FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students create reports"
  ON listing_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins read reports"
  ON listing_reports FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Students manage own maintenance"
  ON maintenance_requests FOR ALL
  USING (auth.uid() = student_id);
