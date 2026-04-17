-- GD Leaders Database — Seed Script
-- Run AFTER 001_initial_schema.sql
-- This seeds the initial data from the JSON files via SQL.
-- You can also use the seed.js script (npm run seed) which reads the JSON files directly.

-- Truncate first so re-running is safe
truncate gd_officers, gd_certs, gd_transfers, gd_terminations,
         gd_port_trials, gd_port_callsigns, gd_fto_officers restart identity cascade;

-- ─── CERTS ───────────────────────────────────────────────────────────────────
insert into gd_certs (id, name, full_name, "order") values
  ('fto',     'FTO',     'Field Training Officer (inc. SFTO)', 1),
  ('airwing', 'Airwing', 'Airwing',    2),
  ('rcv',     'RCV',     'RCV',        3),
  ('port',    'PORT',    'PORT',       4),
  ('k9',      'K9',      'K9',         5),
  ('ciu',     'CIU',     'CIU',        6),
  ('cso',     'CSO',     'CSO',        7),
  ('oc',      'OC',      'OC Spray',   8);

-- Officers, transfers, terminations, PORT trials, PORT callsigns, and FTO officers
-- are seeded via `npm run seed` (scripts/seed.js) which reads src/data/*.json
-- and upserts them into Supabase using the JS client.
-- This is faster and avoids writing 400+ lines of raw SQL for the record data.
--
-- To seed manually from SQL, paste the output of:
--   node scripts/generate_seed_sql.js
-- which prints INSERT statements from the JSON files.
