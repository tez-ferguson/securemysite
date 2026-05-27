-- Drop the Clerk JWT helper function and replace RLS policies with
-- native Supabase auth.uid().

-- ─── Drop old Clerk policies ─────────────────────────────────────────────────
drop policy if exists "own_scans_select"      on scan_jobs;
drop policy if exists "own_scans_insert"      on scan_jobs;
drop policy if exists "own_scans_update"      on scan_jobs;
drop policy if exists "own_findings_select"   on scan_findings;
drop policy if exists "service_findings_insert" on scan_findings;
drop policy if exists "own_unlocks_select"    on scan_unlocks;
drop policy if exists "service_unlocks_insert" on scan_unlocks;

-- ─── Drop the Clerk JWT helper ───────────────────────────────────────────────
drop function if exists requesting_user_id();

-- ─── scan_jobs policies ──────────────────────────────────────────────────────
create policy "own_scans_select" on scan_jobs
  for select using (user_id = auth.uid()::text);

create policy "own_scans_insert" on scan_jobs
  for insert with check (user_id = auth.uid()::text);

create policy "own_scans_update" on scan_jobs
  for update using (user_id = auth.uid()::text);

-- ─── scan_findings policies ──────────────────────────────────────────────────
create policy "own_findings_select" on scan_findings
  for select using (
    scan_job_id in (
      select id from scan_jobs where user_id = auth.uid()::text
    )
  );

-- Service role bypasses RLS; this policy covers anon inserts if ever needed
create policy "service_findings_insert" on scan_findings
  for insert with check (true);

-- ─── scan_unlocks policies ───────────────────────────────────────────────────
create policy "own_unlocks_select" on scan_unlocks
  for select using (user_id = auth.uid()::text);

create policy "service_unlocks_insert" on scan_unlocks
  for insert with check (true);
