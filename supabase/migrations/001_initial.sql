-- Enable UUID extension
create extension if not exists "pgcrypto";

-- scan_jobs
create table if not exists scan_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  repo_url text not null,
  repo_name text,
  site_url text,
  status text not null default 'queued',
  github_installation_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists scan_jobs_user_id_idx on scan_jobs(user_id);
create index if not exists scan_jobs_status_idx on scan_jobs(status);

-- scan_findings
create table if not exists scan_findings (
  id uuid primary key default gen_random_uuid(),
  scan_job_id uuid not null references scan_jobs(id) on delete cascade,
  findings jsonb,
  total_count int not null default 0,
  critical_count int not null default 0,
  high_count int not null default 0,
  medium_count int not null default 0,
  low_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists scan_findings_job_idx on scan_findings(scan_job_id);

-- scan_unlocks
create table if not exists scan_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  scan_job_id uuid not null references scan_jobs(id) on delete cascade,
  unlock_type text not null check (unlock_type in ('report', 'agent_fix')),
  stripe_payment_intent_id text,
  stripe_session_id text,
  unlocked_at timestamptz not null default now()
);

create index if not exists scan_unlocks_job_idx on scan_unlocks(scan_job_id);
create index if not exists scan_unlocks_user_idx on scan_unlocks(user_id);

-- Row Level Security
alter table scan_jobs enable row level security;
alter table scan_findings enable row level security;
alter table scan_unlocks enable row level security;

-- Helper function: get requesting user id from JWT claim
-- Clerk passes user_id as the 'sub' claim in the JWT
create or replace function requesting_user_id() returns text
  language sql stable
  as $$
    select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::text
  $$;

-- scan_jobs: users can only see and modify their own jobs
create policy "own_scans_select" on scan_jobs
  for select using (user_id = requesting_user_id());

create policy "own_scans_insert" on scan_jobs
  for insert with check (user_id = requesting_user_id());

create policy "own_scans_update" on scan_jobs
  for update using (user_id = requesting_user_id());

-- scan_findings: readable only through join on scan_jobs ownership
create policy "own_findings_select" on scan_findings
  for select using (
    scan_job_id in (
      select id from scan_jobs where user_id = requesting_user_id()
    )
  );

-- Service role can insert findings (from scanner callback)
-- Note: the service role client (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS automatically.
-- This policy covers anon/authenticated role inserts if ever needed.
create policy "service_findings_insert" on scan_findings
  for insert with check (true);

-- scan_unlocks: users can see their own unlocks
create policy "own_unlocks_select" on scan_unlocks
  for select using (user_id = requesting_user_id());

-- Service role can insert unlocks (from Stripe webhook)
-- Note: the service role client (SUPABASE_SERVICE_ROLE_KEY) bypasses RLS automatically.
create policy "service_unlocks_insert" on scan_unlocks
  for insert with check (true);
