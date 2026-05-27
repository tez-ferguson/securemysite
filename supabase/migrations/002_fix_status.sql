-- Track agent-fix workflow separately from scan lifecycle
alter table scan_jobs add column if not exists fix_status text;
