-- passive_scans is accessed only via service-role API routes (token in URL)
alter table passive_scans disable row level security;
