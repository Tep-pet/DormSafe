-- Fix: "Database error saving new user" on registration
-- Run this in Supabase SQL Editor if signup fails

-- Safer profile creation trigger with proper permissions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role := 'student';
  role_text TEXT;
BEGIN
  role_text := NEW.raw_user_meta_data->>'role';

  IF role_text IN ('student', 'owner', 'admin') THEN
    user_role_value := role_text::user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), 'User'),
    user_role_value
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RAISE;
END;
$$;

-- Recreate trigger (works on PostgreSQL 14+)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Allow Supabase Auth to insert profiles via trigger
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT USAGE ON TYPE public.user_role TO supabase_auth_admin;
