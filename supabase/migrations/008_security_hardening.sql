-- Track which GitHub App installations belong to which users.
-- This prevents cross-user installation ID guessing attacks.
create table if not exists github_installations (
  installation_id bigint primary key,
  user_id text not null,
  created_at timestamptz not null default now()
);

create index if not exists github_installations_user_idx on github_installations(user_id);

-- Enable RLS so the anon key cannot read other users' installations
alter table github_installations enable row level security;

create policy "own_installations_select" on github_installations
  for select using (user_id = auth.uid()::text);

create policy "own_installations_insert" on github_installations
  for insert with check (user_id = auth.uid()::text);

-- Stripe webhook idempotency: one row per (scan_job_id, unlock_type, stripe_session_id).
-- Prevents duplicate inserts when Stripe retries checkout.session.completed.
create unique index if not exists scan_unlocks_session_unique
  on scan_unlocks(stripe_session_id)
  where stripe_session_id is not null;

-- Tighten permissive insert policies: findings can only be inserted for jobs
-- that actually exist (referential integrity is already enforced by FK, but
-- this removes the blanket `with check (true)` that would allow any
-- authenticated/anon role to insert).
drop policy if exists "service_findings_insert" on scan_findings;
create policy "service_findings_insert" on scan_findings
  for insert with check (
    scan_job_id in (select id from scan_jobs)
  );

drop policy if exists "service_unlocks_insert" on scan_unlocks;
create policy "service_unlocks_insert" on scan_unlocks
  for insert with check (
    scan_job_id in (select id from scan_jobs where user_id = auth.uid()::text)
  );
