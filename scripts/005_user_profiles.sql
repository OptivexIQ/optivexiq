begin;

-- 1. Create enum type (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid WHERE t.typname = 'user_role' AND n.nspname = 'public') THEN
    CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'founder', 'support');
  END IF;
END$$;

-- 2. Create table using the enum and referencing auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'founder',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- helper function to check roles
CREATE OR REPLACE FUNCTION public.has_role(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    auth.jwt() -> 'app_metadata' ->> 'role',
    auth.jwt() -> 'user_metadata' ->> 'role'
  ) = ANY(roles);
$$;

-- drop any old policy names that might conflict
DROP POLICY IF EXISTS user_profiles_manage_own ON public.user_profiles;

-- SELECT policy
CREATE POLICY user_profiles_select_own_or_admin
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(ARRAY['super_admin','admin'])
  );

-- INSERT policy
CREATE POLICY user_profiles_insert_own
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE policy
CREATE POLICY user_profiles_update_own
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE policy
CREATE POLICY user_profiles_delete_own
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- trigger function to create profile for new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _name text;
BEGIN
  _name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'fullName',
    NEW.raw_user_meta_data ->> 'name'
  );

  INSERT INTO public.user_profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    _name,
    COALESCE(
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.raw_user_meta_data ->> 'avatarUrl'
    )
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'starter', 'inactive')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (
    user_id,
    workspace_name,
    primary_contact,
    region
  )
  VALUES (
    NEW.id,
    CASE WHEN _name IS NULL THEN NULL ELSE _name || ' Workspace' END,
    NEW.email,
    NULLIF(NEW.raw_user_meta_data ->> 'region', '')
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.usage_tracking (
    user_id,
    billing_period_start,
    billing_period_end,
    tokens_used,
    competitor_gaps_used,
    rewrites_used,
    ai_cost_cents,
    updated_at
  )
  VALUES (
    NEW.id,
    now(),
    now() + interval '30 days',
    0,
    0,
    0,
    0,
    now()
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() OWNER TO postgres;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, supabase_auth_admin;

-- trigger on auth.users (fires when Supabase creates a new auth.user)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

commit;