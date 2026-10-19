-- Account verification (student ID / owner ID + license), notifications, profile status

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS verification_status verification_status DEFAULT 'pending';

-- Existing seeded users: treat as already approved
UPDATE profiles SET verification_status = 'approved' WHERE verification_status IS NULL OR verification_status = 'pending';

ALTER TABLE profiles
  ALTER COLUMN verification_status SET DEFAULT 'pending';

CREATE TABLE IF NOT EXISTS account_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  id_storage_path TEXT NOT NULL,
  license_storage_path TEXT,
  status verification_status NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_account_verifications_status ON account_verifications(status);
CREATE INDEX IF NOT EXISTS idx_account_verifications_user ON account_verifications(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_verifications_one_pending
  ON account_verifications (user_id)
  WHERE status = 'pending';

CREATE TYPE notification_type AS ENUM (
  'account_submitted',
  'account_reviewed',
  'listing_submitted',
  'listing_reviewed'
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications (user_id)
  WHERE read_at IS NULL;

-- Private bucket for ID / license documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE account_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own account verifications"
  ON account_verifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage account verifications"
  ON account_verifications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users mark own notifications read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all notifications"
  ON notifications FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Verification docs owner read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Verification docs admin read"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Service role uploads verification docs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'verification-docs');
