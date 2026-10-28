# eSecurityIn Employee Task Tracker — Vercel Deployment & Supabase Setup Guide

This guide details the complete production deployment process for the **eSecurityIn Employee Task Tracker** using **Supabase** (PostgreSQL Database, Auth, and Row-Level Security) and **Vercel** (Hosting and Serverless Runtime) connected via **GitHub**.

---

## 1. Supabase Project Setup & Database Migration

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and log in.
2. Create a new organization (e.g., `eSecurityIn`) and create a new project (e.g., `esecurityin-tracker`).
3. Select your preferred database region (e.g., Singapore, Frankfurt, or US East).
4. Save the database password securely.

### 1.2 Run Database Schema Migration
1. In your Supabase Dashboard, navigate to **SQL Editor** on the left menu.
2. Click **New Query**.
3. Copy the full SQL content from `supabase/migrations/20250101000000_esecurityin_schema.sql` (or from the in-app **Supabase Setup Hub**).
4. Click **Run**.
5. Verify that all 10 tables are created with Row-Level Security (RLS) enabled:
   - `profiles`
   - `projects`
   - `work_items`
   - `work_assignments`
   - `daily_reports`
   - `daily_work_entries`
   - `progress_history`
   - `report_comments`
   - `notifications`
   - `audit_logs`

### 1.3 Configure Authentication & Email Settings
1. Go to **Authentication -> Providers -> Email**:
   - Ensure **Enable Email provider** is turned **ON**.
   - Optional: Toggle "Confirm email" according to your company policy (for internal tools, you can turn off email confirmation or configure your custom SMTP server).
2. Go to **Authentication -> URL Configuration**:
   - **Site URL**: Set to your production Vercel domain (e.g., `https://esecurityin-tracker.vercel.app`).
   - **Redirect URLs**: Add:
     - `https://esecurityin-tracker.vercel.app/**`
     - `https://esecurityin-tracker.vercel.app/reset-password`
     - `http://localhost:3000/**` (for local development)

### 1.4 Initial Admin Bootstrapping
There are two secure methods to create the first Administrator:
- **Method A (Automatic First-User Promotion)**:
  The database trigger `handle_new_user()` checks `SELECT count(*) FROM public.profiles;`. If no profiles exist yet, the very first user who signs up through the app is automatically assigned the `admin` role!
- **Method B (Explicit SQL Elevation)**:
  Have your primary administrator register with their corporate email (e.g., `admin@esecurityin.com`), then run this in the Supabase SQL Editor:
  ```sql
  UPDATE public.profiles
  SET role = 'admin'
  WHERE email = 'admin@esecurityin.com';
  ```

---

## 2. GitHub Repository Configuration

1. Initialize git and commit the codebase:
   ```bash
   git init
   git add .
   git commit -m "feat: complete eSecurityIn task tracker with Supabase & RLS"
   ```
2. Create a private GitHub repository under your organization (`eSecurityIn/employee-task-tracker`).
3. Push your main branch:
   ```bash
   git remote add origin https://github.com/eSecurityIn/employee-task-tracker.git
   git branch -M main
   git push -u origin main
   ```

---

## 3. Vercel Deployment

### 3.1 Import Project
1. Log into your [Vercel Dashboard](https://vercel.com).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository `employee-task-tracker`.
4. Framework Preset: **Vite**.
5. Root Directory: `./`.

### 3.2 Environment Variables
Under **Environment Variables**, add the following:

| Variable Name | Value | Purpose |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase API URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Supabase Anonymous Client Key |

> ⚠️ **CRITICAL SECURITY NOTE**:
> NEVER add `SUPABASE_SERVICE_ROLE_KEY` to Vercel environment variables or client-side code! The application strictly enforces Row-Level Security (RLS) using the public Anon key and verified JWT user tokens.

### 3.3 Deploy
1. Click **Deploy**.
2. Vercel will run `npm run build` and provision the edge routing.
3. Once finished, visit your live URL (e.g. `https://esecurityin-tracker.vercel.app`).

---

## 4. Post-Deployment Verification

1. Open your live Vercel URL.
2. Sign in with the primary admin account.
3. Verify the **Admin Dashboard** displays live counters.
4. Go to **Projects**, create a new project and add subtasks.
5. Create an employee account or invite a colleague.
6. Have the employee submit a daily work report.
7. Confirm that the admin can review, approve, or request revisions.
8. Check Supabase Dashboard **Table Editor** to verify that all records are written with correct foreign keys, timestamps, and RLS integrity.
