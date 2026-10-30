-- Contact info for student inquiries + payment receipt proofs

ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS contact_phone TEXT;

ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_storage_path TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Owners upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Owners read own receipts" ON storage.objects;

CREATE POLICY "Owners upload receipts"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'receipts'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners read own receipts"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'receipts'
    AND (
      public.current_user_role() = 'admin'
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );
