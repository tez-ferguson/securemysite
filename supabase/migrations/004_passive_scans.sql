-- Passive URL scans (anonymous, token-gated access — no RLS)
create table passive_scans (
  id uuid primary key default gen_random_uuid(),
  token uuid not null unique default gen_random_uuid(),
  url text not null,
  email text not null,
  status text not null default 'queued',
  findings jsonb,
  total_count int default 0,
  critical_count int default 0,
  high_count int default 0,
  medium_count int default 0,
  low_count int default 0,
  paid boolean not null default false,
  stripe_session_id text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index passive_scans_token_idx on passive_scans(token);
create index passive_scans_email_idx on passive_scans(email);
