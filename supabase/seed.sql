-- ==============================================================================
-- eSecurityIn Sample Seed Data (For Development & Demonstration)
-- ==============================================================================

-- Note: In Supabase production, profiles are generated automatically when
-- users sign up via auth.users. The statements below demonstrate the data
-- format for projects, work items, and assignments.

-- Insert Sample Projects
INSERT INTO public.projects (id, name, description, status, start_date, deadline)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'FinTech Portal Red Team & Penetration Testing', 'Full-scope blackbox and graybox penetration test of core banking APIs and customer dashboard.', 'active', CURRENT_DATE - INTERVAL '14 days', CURRENT_DATE + INTERVAL '16 days'),
  ('22222222-2222-2222-2222-222222222222', 'AWS Multi-Account Cloud Security Posture Audit', 'CIS AWS Benchmark Level 2 audit, IAM privilege escalation paths analysis, and Terraform policy hardening.', 'active', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '21 days'),
  ('33333333-3333-3333-3333-333333333333', 'ISO 27001:2022 Compliance Readiness Assessment', 'Gap assessment of ISMS policies, access control controls, and incident response runbooks.', 'planning', CURRENT_DATE + INTERVAL '5 days', CURRENT_DATE + INTERVAL '45 days')
ON CONFLICT (id) DO NOTHING;

-- Insert Work Items (Subtasks & Standalone items)
INSERT INTO public.work_items (id, project_id, title, description, priority, status, start_date, deadline, estimated_hours, overall_progress)
VALUES
  ('aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'OAuth 2.0 & Session Management Vulnerability Testing', 'Audit JWT signing mechanisms, refresh token rotation, and cross-origin authentication bypasses.', 'critical', 'in_progress', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '3 days', 32.00, 65.00),
  ('aaaa2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'API Business Logic Flaws & BOLA Assessment', 'Test IDOR / BOLA endpoints across money transfer and profile management routes.', 'high', 'in_progress', CURRENT_DATE - INTERVAL '8 days', CURRENT_DATE + INTERVAL '6 days', 28.00, 45.00),
  ('aaaa3333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Executive Report & PoC Exploitation Writeup', 'Compile executive summary, CVSS 3.1 severity scores, remediation steps, and validated PoCs.', 'medium', 'pending', CURRENT_DATE + INTERVAL '4 days', CURRENT_DATE + INTERVAL '16 days', 20.00, 0.00),
  ('bbbb1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'IAM Principal Least Privilege & Role Trust Review', 'Scan cross-account IAM roles, privilege escalation paths, and wildcard permissions.', 'high', 'in_progress', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 24.00, 80.00),
  ('cccc1111-1111-1111-1111-111111111111', NULL, 'Urgent Zero-Day Patching Advisory: Fortinet CVE-2024-XXXX', 'Produce emergency bulletin and indicators of compromise (IoC) rule set for enterprise SOC clients.', 'critical', 'in_progress', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '1 day', 12.00, 75.00)
ON CONFLICT (id) DO NOTHING;
