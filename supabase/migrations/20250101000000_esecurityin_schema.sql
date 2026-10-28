-- ==============================================================================
-- eSecurityIn Employee Daily Work Tracker: Database Schema & RLS Migration
-- Production-ready PostgreSQL schema with Row-Level Security, Constraints,
-- Triggers, and Role-Based Access Control for Supabase.
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Custom Types & Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE item_status AS ENUM ('pending', 'in_progress', 'on_hold', 'completed', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM ('assigned', 'in_progress', 'completed', 'reassigned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('draft', 'submitted', 'approved', 'revision_requested');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Utility Function: Updated Timestamp Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- TABLE DEFINITIONS
-- ==============================================================================

-- 3.1 profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL DEFAULT 'Cybersecurity',
    job_title TEXT NOT NULL DEFAULT 'Security Specialist',
    role user_role NOT NULL DEFAULT 'employee',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'active',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 work_items (Projects Subtasks or Standalone Tasks)
CREATE TABLE IF NOT EXISTS public.work_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL, -- nullable for standalone
    title TEXT NOT NULL,
    description TEXT,
    priority item_priority NOT NULL DEFAULT 'medium',
    status item_status NOT NULL DEFAULT 'pending',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    deadline DATE,
    estimated_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00 CHECK (estimated_hours >= 0),
    overall_progress NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.4 work_assignments
CREATE TABLE IF NOT EXISTS public.work_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    assignment_status assignment_status NOT NULL DEFAULT 'assigned',
    CONSTRAINT unique_work_item_employee UNIQUE (work_item_id, employee_id)
);

-- 3.5 daily_reports
CREATE TABLE IF NOT EXISTS public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    status report_status NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_employee_report_date UNIQUE (employee_id, report_date)
);

-- 3.6 daily_work_entries
CREATE TABLE IF NOT EXISTS public.daily_work_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE RESTRICT,
    activity_description TEXT NOT NULL,
    work_completed TEXT NOT NULL,
    hours_spent NUMERIC(4, 2) NOT NULL CHECK (hours_spent >= 0 AND hours_spent <= 24),
    minutes_spent INTEGER NOT NULL DEFAULT 0 CHECK (minutes_spent >= 0 AND minutes_spent < 60),
    daily_progress_percentage NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (daily_progress_percentage >= 0 AND daily_progress_percentage <= 100),
    reported_overall_progress NUMERIC(5, 2) NOT NULL DEFAULT 0.00 CHECK (reported_overall_progress >= 0 AND reported_overall_progress <= 100),
    blockers TEXT,
    next_steps TEXT,
    deliverable_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.7 progress_history
CREATE TABLE IF NOT EXISTS public.progress_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_item_id UUID NOT NULL REFERENCES public.work_items(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    previous_progress NUMERIC(5, 2) NOT NULL,
    new_progress NUMERIC(5, 2) NOT NULL,
    change_description TEXT,
    source_daily_entry_id UUID REFERENCES public.daily_work_entries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 report_comments
CREATE TABLE IF NOT EXISTS public.report_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_report_id UUID NOT NULL REFERENCES public.daily_reports(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.9 notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.10 audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON public.profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_work_items_project_id ON public.work_items(project_id);
CREATE INDEX IF NOT EXISTS idx_work_items_status ON public.work_items(status);
CREATE INDEX IF NOT EXISTS idx_work_assignments_employee_id ON public.work_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_work_assignments_work_item_id ON public.work_assignments(work_item_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_employee_id ON public.daily_reports(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_report_date ON public.daily_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON public.daily_reports(status);
CREATE INDEX IF NOT EXISTS idx_daily_work_entries_report_id ON public.daily_work_entries(daily_report_id);
CREATE INDEX IF NOT EXISTS idx_daily_work_entries_work_item_id ON public.daily_work_entries(work_item_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ==============================================================================
-- TRIGGERS FOR updated_at
-- ==============================================================================
CREATE OR REPLACE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_work_items_updated_at BEFORE UPDATE ON public.work_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_daily_reports_updated_at BEFORE UPDATE ON public.daily_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER set_daily_work_entries_updated_at BEFORE UPDATE ON public.daily_work_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================================================
-- HELPER FUNCTIONS FOR SECURITY (SECURITY DEFINER)
-- ==============================================================================

-- Check if current authenticated user has an active admin profile
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
  );
$$;

-- Check if current authenticated user has an active profile
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND is_active = TRUE
  );
$$;

-- Trigger to safely create a profile entry upon Supabase auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role user_role;
  v_emp_id TEXT;
  v_count INT;
BEGIN
  -- First user in the system automatically becomes the primary admin
  SELECT COUNT(*) INTO v_count FROM public.profiles;
  IF v_count = 0 THEN
    v_role := 'admin'::user_role;
  ELSE
    v_role := 'employee'::user_role;
  END IF;

  -- Generate default Employee ID if not supplied in metadata
  v_emp_id := COALESCE(
    NEW.raw_user_meta_data->>'employee_id',
    'ESI-' || LPAD((v_count + 101)::TEXT, 4, '0')
  );

  INSERT INTO public.profiles (
    id,
    employee_id,
    full_name,
    email,
    department,
    job_title,
    role,
    is_active
  ) VALUES (
    NEW.id,
    v_emp_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'department', 'Cybersecurity Operations'),
    COALESCE(NEW.raw_user_meta_data->>'job_title', 'Security Analyst'),
    v_role,
    TRUE
  ) ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Bind trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_work_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 1. PROFILES RLS
-- ------------------------------------------------------------------------------
-- Active authenticated users can read all active profiles (for team assignees, mentions, reviews)
CREATE POLICY "Profiles are viewable by active authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (public.is_active_user() OR id = auth.uid());

-- Users can update their own personal non-privileged profile data
CREATE POLICY "Users can update their own non-privileged profile info"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid()) -- Prevents self-escalation to admin
  AND is_active = (SELECT p.is_active FROM public.profiles p WHERE p.id = auth.uid()) -- Cannot unban self
);

-- Admins can update any profile (e.g., promote to admin, deactivate, change department)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. PROJECTS RLS
-- ------------------------------------------------------------------------------
-- All active employees can view projects
CREATE POLICY "Active users can view projects"
ON public.projects FOR SELECT
TO authenticated
USING (public.is_active_user());

-- Only admins can insert, update, or delete projects
CREATE POLICY "Admins can insert projects"
ON public.projects FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. WORK_ITEMS RLS
-- ------------------------------------------------------------------------------
-- Admins can view all work items; employees can view work items assigned to them or their projects
CREATE POLICY "Users can view permitted work items"
ON public.work_items FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.work_assignments wa
    WHERE wa.work_item_id = public.work_items.id
      AND wa.employee_id = auth.uid()
  )
);

-- Only admins can create, update, and delete work items
CREATE POLICY "Admins can insert work items"
ON public.work_items FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update work items"
ON public.work_items FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete work items"
ON public.work_items FOR DELETE
TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. WORK_ASSIGNMENTS RLS
-- ------------------------------------------------------------------------------
-- Admins see all assignments; employees see assignments allocated to themselves
CREATE POLICY "Users can view relevant work assignments"
ON public.work_assignments FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR employee_id = auth.uid()
);

-- Only admins can assign or reassign work items
CREATE POLICY "Admins can manage work assignments"
ON public.work_assignments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 5. DAILY_REPORTS RLS
-- ------------------------------------------------------------------------------
-- Admins can view all daily reports; employees can view only their own
CREATE POLICY "Users can view permitted daily reports"
ON public.daily_reports FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR employee_id = auth.uid()
);

-- Employees can create daily reports for themselves
CREATE POLICY "Employees can create their own daily reports"
ON public.daily_reports FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid()
  AND public.is_active_user()
);

-- Employees can update their own daily reports if in 'draft' or 'revision_requested'
CREATE POLICY "Employees can update their draft or revision-requested reports"
ON public.daily_reports FOR UPDATE
TO authenticated
USING (
  employee_id = auth.uid()
  AND status IN ('draft', 'revision_requested')
)
WITH CHECK (
  employee_id = auth.uid()
  AND status IN ('draft', 'submitted') -- Employee cannot self-approve
);

-- Admins can review and update status of any daily report
CREATE POLICY "Admins can review any daily report"
ON public.daily_reports FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Employees can delete only their own draft reports
CREATE POLICY "Employees can delete draft reports"
ON public.daily_reports FOR DELETE
TO authenticated
USING (
  employee_id = auth.uid()
  AND status = 'draft'
);

-- ------------------------------------------------------------------------------
-- 6. DAILY_WORK_ENTRIES RLS
-- ------------------------------------------------------------------------------
-- Viewable by admins or the report owner
CREATE POLICY "Users can view permitted work entries"
ON public.daily_work_entries FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.daily_work_entries.daily_report_id
      AND dr.employee_id = auth.uid()
  )
);

-- Employees can insert work entries only to their own draft or revision_requested reports
CREATE POLICY "Employees can insert entries into their editable reports"
ON public.daily_work_entries FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.daily_work_entries.daily_report_id
      AND dr.employee_id = auth.uid()
      AND dr.status IN ('draft', 'revision_requested')
  )
);

-- Employees can update entries only on their own editable reports
CREATE POLICY "Employees can update entries in their editable reports"
ON public.daily_work_entries FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.daily_work_entries.daily_report_id
      AND dr.employee_id = auth.uid()
      AND dr.status IN ('draft', 'revision_requested')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.daily_work_entries.daily_report_id
      AND dr.employee_id = auth.uid()
      AND dr.status IN ('draft', 'revision_requested')
  )
);

-- Employees can delete entries from their own editable reports
CREATE POLICY "Employees can delete entries from their editable reports"
ON public.daily_work_entries FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.daily_work_entries.daily_report_id
      AND dr.employee_id = auth.uid()
      AND dr.status IN ('draft', 'revision_requested')
  )
);

-- ------------------------------------------------------------------------------
-- 7. REPORT_COMMENTS RLS
-- ------------------------------------------------------------------------------
-- Viewable if user is admin or the report owner
CREATE POLICY "Comments viewable by report owner or admin"
ON public.report_comments FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.daily_reports dr
    WHERE dr.id = public.report_comments.daily_report_id
      AND dr.employee_id = auth.uid()
  )
);

-- Admins and report owners can comment
CREATE POLICY "Admins and report owners can add comments"
ON public.report_comments FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid()
  AND (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.daily_reports dr
      WHERE dr.id = public.report_comments.daily_report_id
        AND dr.employee_id = auth.uid()
    )
  )
);

-- ------------------------------------------------------------------------------
-- 8. PROGRESS_HISTORY RLS
-- ------------------------------------------------------------------------------
CREATE POLICY "Progress history viewable by authorized users"
ON public.progress_history FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR employee_id = auth.uid()
);

CREATE POLICY "Authorized users can log progress history"
ON public.progress_history FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid()
  OR public.is_admin()
);

-- ------------------------------------------------------------------------------
-- 9. NOTIFICATIONS RLS
-- ------------------------------------------------------------------------------
-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

-- Users can mark their own notifications as read
CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid())
WITH CHECK (recipient_id = auth.uid());

-- System or admins can create notifications
CREATE POLICY "Admins or self can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR recipient_id = auth.uid());

-- ------------------------------------------------------------------------------
-- 10. AUDIT_LOGS RLS
-- ------------------------------------------------------------------------------
-- Only admins can read audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_admin());

-- Authenticated users can insert audit logs for actions they perform
CREATE POLICY "Active users can append audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() OR actor_id IS NULL);

-- ==============================================================================
-- INITIAL ADMIN BOOTSTRAP FUNCTION
-- ==============================================================================
-- In Supabase SQL Editor, you can promote any specific email to admin:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'your-admin@esecurityin.com';
