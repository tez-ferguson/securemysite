-- Email automation tracking for passive scans
alter table passive_scans
  add column if not exists report_ready_email_sent_at timestamptz,
  add column if not exists followup_1_sent_at timestamptz,
  add column if not exists followup_2_sent_at timestamptz,
  add column if not exists unsubscribed_at timestamptz,
  add column if not exists unsubscribe_token uuid not null default gen_random_uuid();

create unique index if not exists passive_scans_unsubscribe_token_idx
  on passive_scans(unsubscribe_token);

create index if not exists passive_scans_followup_idx
  on passive_scans(status, paid, completed_at)
  where status = 'complete' and paid = false;
