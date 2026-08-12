-- Waitlist (email only) and a public enrichment counter.
-- No document content is stored anywhere.

create table if not exists waitlist (
  email text primary key,
  created_at timestamptz default CURRENT_TIMESTAMP not null
);

create table if not exists stats (
  key text primary key,
  value bigint not null default 0
);

insert into stats (key, value) values ('documents_enriched', 1)
  on conflict (key) do nothing;
insert into stats (key, value) values ('tokens_saved', 4200)
  on conflict (key) do nothing;
