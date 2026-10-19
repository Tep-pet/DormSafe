-- DormSafe: Row Level Security policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Properties — students see approved+verified only
-- ---------------------------------------------------------------------------
CREATE POLICY "Students view approved verified properties"
  ON properties FOR SELECT
  USING (
    (status = 'approved' AND is_verified = TRUE)
    OR owner_id = auth.uid()
    OR public.current_user_role() = 'admin'
  );

CREATE POLICY "Owners insert own properties"
  ON properties FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND public.current_user_role() = 'owner');

CREATE POLICY "Owners update own properties"
  ON properties FOR UPDATE
  USING (owner_id = auth.uid() AND public.current_user_role() = 'owner');

CREATE POLICY "Admins manage all properties"
  ON properties FOR ALL
  USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Rooms
-- ---------------------------------------------------------------------------
CREATE POLICY "View rooms for visible properties"
  ON rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = rooms.property_id
      AND (
        (p.status = 'approved' AND p.is_verified = TRUE)
        OR p.owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Owners manage own rooms"
  ON rooms FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = rooms.property_id AND p.owner_id = auth.uid()
    )
    AND public.current_user_role() = 'owner'
  );

CREATE POLICY "Admins manage all rooms"
  ON rooms FOR ALL
  USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Room images & house rules — same visibility as parent property
-- ---------------------------------------------------------------------------
CREATE POLICY "View room images"
  ON room_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = room_images.room_id
      AND (
        (p.status = 'approved' AND p.is_verified = TRUE)
        OR p.owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Owners manage room images"
  ON room_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN properties p ON p.id = r.property_id
      WHERE r.id = room_images.room_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "View house rules"
  ON house_rules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = house_rules.property_id
      AND (
        (p.status = 'approved' AND p.is_verified = TRUE)
        OR p.owner_id = auth.uid()
        OR public.current_user_role() = 'admin'
      )
    )
  );

CREATE POLICY "Owners manage house rules"
  ON house_rules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = house_rules.property_id AND p.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Owner verifications
-- ---------------------------------------------------------------------------
CREATE POLICY "Owners view own verifications"
  ON owner_verifications FOR SELECT
  USING (owner_id = auth.uid() OR public.current_user_role() = 'admin');

CREATE POLICY "Owners submit verifications"
  ON owner_verifications FOR INSERT
  WITH CHECK (owner_id = auth.uid() AND public.current_user_role() = 'owner');

CREATE POLICY "Admins review verifications"
  ON owner_verifications FOR UPDATE
  USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Tenants & payments (owner ledger — Sprint 2)
-- ---------------------------------------------------------------------------
CREATE POLICY "Owners manage tenants"
  ON tenants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = tenants.property_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners manage payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM tenants t
      JOIN properties p ON p.id = t.property_id
      WHERE t.id = payments.tenant_id AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins view tenants and payments"
  ON tenants FOR SELECT USING (public.current_user_role() = 'admin');
CREATE POLICY "Admins view payments"
  ON payments FOR SELECT USING (public.current_user_role() = 'admin');

-- ---------------------------------------------------------------------------
-- Storage policies
-- ---------------------------------------------------------------------------
CREATE POLICY "Public read room images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'room-images');

CREATE POLICY "Owners upload room images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'room-images'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Owners upload permits"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'permits'
    AND auth.role() = 'authenticated'
    AND public.current_user_role() = 'owner'
  );

CREATE POLICY "Owners and admins read permits"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'permits'
    AND (
      public.current_user_role() = 'admin'
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );
