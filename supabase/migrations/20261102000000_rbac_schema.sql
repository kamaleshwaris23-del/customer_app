-- ==============================================================================
-- Door2Life: Complete Role-Based Access Control (RBAC) & Database Schema
-- Roles: super_admin, admin, team_member
-- ==============================================================================

-- 1. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('super_admin', 'admin', 'team_member')) DEFAULT 'team_member',
  status text NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookup on profile queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- 2. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id text PRIMARY KEY,
  full_name text NOT NULL,
  age integer NOT NULL CHECK (age >= 1 AND age <= 120),
  gender text NOT NULL,
  primary_contact text NOT NULL,
  email text,
  location text,
  occupation text NOT NULL,
  category text NOT NULL,
  categories text[] DEFAULT '{}',
  custom_category text,
  interests text,
  notes text,
  business_name text,
  business_category text,
  business_categories text[] DEFAULT '{}',
  custom_business_category text,
  business_services text,
  business_location text,
  business_idea text,
  training_required boolean DEFAULT false,
  mentorship_required boolean DEFAULT false,
  business_expansion boolean DEFAULT false,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  assigned_agent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_assigned_agent ON public.customers(assigned_agent_id);
CREATE INDEX IF NOT EXISTS idx_customers_created_by ON public.customers(created_by);
CREATE INDEX IF NOT EXISTS idx_customers_primary_contact ON public.customers(primary_contact);

-- 3. Create Follow-ups Table
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id text PRIMARY KEY,
  customer_id text REFERENCES public.customers(id) ON DELETE CASCADE,
  customer_name text,
  customer_phone text,
  task_title text NOT NULL,
  due_date text NOT NULL,
  due_time text,
  channel text NOT NULL,
  priority text NOT NULL,
  status text NOT NULL DEFAULT 'Upcoming',
  notes text,
  assigned_to uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_customer ON public.follow_ups(customer_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_assigned_to ON public.follow_ups(assigned_to);
CREATE INDEX IF NOT EXISTS idx_follow_ups_created_by ON public.follow_ups(created_by);

-- 4. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_email text,
  user_role text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- 5. Helper Functions (SECURITY DEFINER with fixed search_path to prevent recursion)
-- ==============================================================================

-- Check caller role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() AND status = 'active';
$$;

-- Check if caller is active super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND status = 'active'
  );
$$;

-- Check if caller is active admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('super_admin', 'admin') AND status = 'active'
  );
$$;

-- Check caller account status
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND status = 'active'
  );
$$;

-- ==============================================================================
-- 6. Super Admin One-Time Bootstrap Function
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.bootstrap_initial_super_admin()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_super_count integer;
  v_profile_record public.profiles%ROWTYPE;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Authentication required to bootstrap Super Admin.';
  END IF;

  -- Ensure no super_admin already exists
  SELECT count(*) INTO v_super_count FROM public.profiles WHERE role = 'super_admin';
  IF v_super_count > 0 THEN
    RAISE EXCEPTION 'Bootstrap locked: A Super Admin already exists in this system.';
  END IF;

  -- Elevate calling user profile to super_admin
  UPDATE public.profiles
  SET role = 'super_admin', status = 'active', updated_at = now()
  WHERE id = v_uid
  RETURNING * INTO v_profile_record;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile record for calling user not found.';
  END IF;

  -- Record audit event
  INSERT INTO public.audit_logs (user_id, user_email, user_role, action, entity_type, entity_id, details)
  VALUES (
    v_profile_record.id,
    v_profile_record.email,
    'super_admin',
    'user_role_change',
    'profiles',
    v_profile_record.id::text,
    jsonb_build_object('message', 'Initial Super Admin bootstrapped successfully.')
  );

  RETURN json_build_object('success', true, 'profile', row_to_json(v_profile_record));
END;
$$;

-- ==============================================================================
-- 7. Automated Profile Provisioning Trigger on auth.users Sign Up
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    'team_member', -- Always default to team_member. Super Admin must promote or bootstrap.
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 8. Row Level Security (RLS) Policies
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES RLS
-- ------------------------------------------------------------------------------

-- SELECT:
-- 1. Super Admin: full access to all profiles
-- 2. Admin: view all profiles for operational oversight & assignment
-- 3. Team Member: view own profile and colleague names for assignment display
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR id = auth.uid()
    OR (public.is_active_user() AND status = 'active')
  );

-- INSERT:
-- Only Super Admin can insert profiles manually (auth trigger handles sign-ups)
CREATE POLICY "profiles_insert_policy"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- UPDATE:
-- Super Admin can update any profile.
-- Regular users can update their own full_name but CANNOT change their own role or status.
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    public.is_super_admin()
    OR (
      id = auth.uid()
      AND public.is_active_user()
    )
  )
  WITH CHECK (
    -- If Super Admin, allow any update
    public.is_super_admin()
    OR (
      -- If self, role and status MUST NOT be changed
      id = auth.uid()
      AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND status = (SELECT p.status FROM public.profiles p WHERE p.id = auth.uid())
    )
  );

-- DELETE:
-- Only Super Admin can delete profiles
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- CUSTOMERS RLS
-- ------------------------------------------------------------------------------

-- SELECT:
-- Super Admin & Admin: can view all customers
-- Team Member: can view only customers assigned to them or created by them
CREATE POLICY "customers_select_policy"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND (assigned_agent_id = auth.uid() OR created_by = auth.uid())
    )
  );

-- INSERT:
-- Super Admin & Admin: can insert any customer
-- Team Member: must record created_by = auth.uid(), and cannot assign to others
CREATE POLICY "customers_insert_policy"
  ON public.customers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND created_by = auth.uid()
      AND (assigned_agent_id IS NULL OR assigned_agent_id = auth.uid())
    )
  );

-- UPDATE:
-- Super Admin & Admin: can update any customer record (including reassigning agent)
-- Team Member: can update only permitted customers, and CANNOT change assigned_agent_id
CREATE POLICY "customers_update_policy"
  ON public.customers
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND (assigned_agent_id = auth.uid() OR created_by = auth.uid())
    )
  )
  WITH CHECK (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND (assigned_agent_id = auth.uid() OR created_by = auth.uid())
      -- Team Member cannot reassign to another agent
      AND assigned_agent_id = (SELECT c.assigned_agent_id FROM public.customers c WHERE c.id = customers.id)
    )
  );

-- DELETE:
-- Only Super Admin can delete customer records
CREATE POLICY "customers_delete_policy"
  ON public.customers
  FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ------------------------------------------------------------------------------
-- FOLLOW-UPS RLS
-- ------------------------------------------------------------------------------

-- SELECT:
-- Super Admin & Admin: can view all follow-ups
-- Team Member: can view only follow-ups assigned to them or created by them
CREATE POLICY "follow_ups_select_policy"
  ON public.follow_ups
  FOR SELECT
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
  );

-- INSERT:
-- Super Admin & Admin: can insert any follow-up
-- Team Member: can insert follow-ups where created_by = auth.uid()
CREATE POLICY "follow_ups_insert_policy"
  ON public.follow_ups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND created_by = auth.uid()
    )
  );

-- UPDATE:
-- Super Admin & Admin: can update any follow-up
-- Team Member: can update assigned follow-up (e.g. mark complete or reschedule)
CREATE POLICY "follow_ups_update_policy"
  ON public.follow_ups
  FOR UPDATE
  TO authenticated
  USING (
    public.is_admin_or_super_admin()
    OR (
      public.is_active_user()
      AND (assigned_to = auth.uid() OR created_by = auth.uid())
    )
  );

-- DELETE:
-- Super Admin & Admin can delete follow-ups
CREATE POLICY "follow_ups_delete_policy"
  ON public.follow_ups
  FOR DELETE
  TO authenticated
  USING (public.is_admin_or_super_admin());

-- ------------------------------------------------------------------------------
-- AUDIT LOGS RLS
-- ------------------------------------------------------------------------------

-- SELECT:
-- ONLY Super Admin can view the full audit logs
CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_super_admin());

-- INSERT:
-- Any active authenticated user can record audit events for their own actions
CREATE POLICY "audit_logs_insert_policy"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_active_user()
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- UPDATE / DELETE:
-- Audit logs are strictly immutable: no updates or deletes permitted
-- (no UPDATE or DELETE policies created)

