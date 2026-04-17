-- GD Leaders Database — Supabase Schema
-- Run this in the Supabase SQL editor or via `supabase db push`

-- ─── OFFICERS ────────────────────────────────────────────────────────────────
create table if not exists gd_officers (
  id                   text primary key,
  steam_name           text not null default '',
  full_name            text not null default '',
  callsign             text not null default '-',
  rank                 text not null default 'Recruit',
  license_class        text not null default 'Bronze',
  cert_values          jsonb not null default '{}',
  last_rp_misconduct   text not null default '',
  hours_warning        text not null default '',
  date_30_hours        text not null default '',
  last_promotion_date  text not null default '',
  division_join_date   text not null default '',
  rank_restriction     text not null default '',
  on_leave             text not null default 'FALSE',
  expected_return      text not null default '',
  days_on_leave        text not null default 'FALSE',
  updated_at           timestamptz not null default now()
);

-- ─── CERT COLUMNS ────────────────────────────────────────────────────────────
create table if not exists gd_certs (
  id         text primary key,
  name       text not null,
  full_name  text not null,
  "order"    integer not null default 0,
  updated_at timestamptz not null default now()
);

-- ─── TRANSFERS ───────────────────────────────────────────────────────────────
create table if not exists gd_transfers (
  id          text primary key,
  steam_name  text not null default '',
  full_name   text not null default '',
  callsign    text not null default '-',
  rank        text not null default '',
  promo_date  text not null default '',
  division    text not null default '',
  year        text not null default '',
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

-- ─── TERMINATIONS & RESIGNATIONS ─────────────────────────────────────────────
create table if not exists gd_terminations (
  id          text primary key,
  steam_name  text not null default '',
  full_name   text not null default '',
  callsign    text not null default '-',
  rank        text not null default '',
  type        text not null default '',   -- 'Terminated' | 'Resigned'
  term_date   text not null default '',
  reason      text not null default '',
  year        text not null default '',
  updated_at  timestamptz not null default now()
);

-- ─── PORT TRIALS ─────────────────────────────────────────────────────────────
create table if not exists gd_port_trials (
  id          text primary key,
  name        text not null default '',
  rank        text not null default '',
  start_date  text not null default '',
  end_date    text not null default '',
  outcome     text not null default 'In Progress',  -- 'Finished' | "Didn't Finish" | 'In Progress'
  notes       text not null default '',
  updated_at  timestamptz not null default now()
);

-- ─── PORT CALLSIGNS ──────────────────────────────────────────────────────────
create table if not exists gd_port_callsigns (
  id          text primary key,
  "group"     text not null default '',
  number      text not null default '',
  officer     text not null default '',
  updated_at  timestamptz not null default now()
);

-- ─── FTO DATABASE ────────────────────────────────────────────────────────────
create table if not exists gd_fto_officers (
  id                  text primary key,
  full_name           text not null default '',
  rank                text not null default '',
  division            text not null default '',
  fto_level           text not null default 'FTO',
  is_fto              text not null default 'N',
  is_sfto             text not null default 'N',
  is_academy_trainer  text not null default 'N',
  is_induction_host   text not null default 'N',
  is_supervisor       text not null default 'N',
  is_leader           text not null default 'N',
  updated_at          timestamptz not null default now()
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
-- The app uses a shared password, not per-user auth.
-- All tables are publicly readable/writable (access controlled by the app password).
-- If you want tighter security, enable Supabase Auth and replace these policies.

alter table gd_officers       enable row level security;
alter table gd_certs          enable row level security;
alter table gd_transfers      enable row level security;
alter table gd_terminations   enable row level security;
alter table gd_port_trials    enable row level security;
alter table gd_port_callsigns enable row level security;
alter table gd_fto_officers   enable row level security;

-- Allow anonymous read/write (the app password gates access client-side)
create policy "anon_all" on gd_officers       for all using (true) with check (true);
create policy "anon_all" on gd_certs          for all using (true) with check (true);
create policy "anon_all" on gd_transfers      for all using (true) with check (true);
create policy "anon_all" on gd_terminations   for all using (true) with check (true);
create policy "anon_all" on gd_port_trials    for all using (true) with check (true);
create policy "anon_all" on gd_port_callsigns for all using (true) with check (true);
create policy "anon_all" on gd_fto_officers   for all using (true) with check (true);
