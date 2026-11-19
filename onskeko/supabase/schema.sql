-- ønskekø – database til prototypen.
-- Kør hele filen i Supabase: SQL Editor → New query → indsæt → Run.

create table if not exists requests (
  id          text primary key,
  club_id     text   not null,
  event_id    text   not null,
  song_id     text   not null,
  title       text   not null,
  artist      text   not null,
  cover       text   not null default '',
  genre       text   not null,
  guest_id    text   not null,
  greeting    text   not null default '',
  status      text   not null default 'active' check (status in ('active', 'played', 'rejected')),
  created_at  bigint not null,
  resolved_at bigint
);
create index if not exists requests_club_event on requests (club_id, event_id);

create table if not exists votes (
  request_id text   not null references requests (id) on delete cascade,
  guest_id   text   not null,
  created_at bigint not null,
  primary key (request_id, guest_id) -- én stemme pr. gæst pr. sang
);

create table if not exists dj_settings (
  club_id        text primary key,
  accepting      boolean not null default true,
  message        text    not null default '',
  allowed_genres text[]  not null default '{}',
  seeded_for     text    not null default ''
);

-- Prototype: alle med appens nøgle må læse og skrive. Skal strammes op før rigtig brug.
alter table requests    enable row level security;
alter table votes       enable row level security;
alter table dj_settings enable row level security;
create policy "prototype_all" on requests    for all using (true) with check (true);
create policy "prototype_all" on votes       for all using (true) with check (true);
create policy "prototype_all" on dj_settings for all using (true) with check (true);

-- Slå Realtime til, så gæst og DJ opdateres live.
alter publication supabase_realtime add table requests, votes, dj_settings;
