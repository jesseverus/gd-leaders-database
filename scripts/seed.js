#!/usr/bin/env node
// scripts/seed.js
// Seeds (or re-seeds) all tables from the JSON files in src/data/.
// Run with:  npm run seed
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
// (service role key so it can bypass RLS)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dir, '../src/data');

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

function load(file) {
  return JSON.parse(readFileSync(join(dataDir, file), 'utf8'));
}

// Column mappers (camelCase → snake_case)
const mappers = {
  gd_officers: (o) => ({
    id: o.id, steam_name: o.steamName, full_name: o.fullName,
    callsign: o.callsign, rank: o.rank, license_class: o.licenseClass,
    cert_values: o.certValues, last_rp_misconduct: o.lastRpMisconduct,
    hours_warning: o.hoursWarning, date_30_hours: o.date30Hours,
    last_promotion_date: o.lastPromotionDate, division_join_date: o.divisionJoinDate,
    rank_restriction: o.rankRestriction, on_leave: o.onLeave,
    expected_return: o.expectedReturn, days_on_leave: o.daysOnLeave,
  }),
  gd_certs: (c) => ({ id: c.id, name: c.name, full_name: c.fullName, order: c.order }),
  gd_transfers: (t) => ({
    id: t.id, steam_name: t.steamName, full_name: t.fullName,
    callsign: t.callsign, rank: t.rank, promo_date: t.promoDate,
    division: t.division, year: t.year, notes: t.notes,
  }),
  gd_terminations: (t) => ({
    id: t.id, steam_name: t.steamName, full_name: t.fullName,
    callsign: t.callsign, rank: t.rank, type: t.type,
    term_date: t.termDate, reason: t.reason, year: t.year,
  }),
  gd_port_trials: (t) => ({
    id: t.id, name: t.name, rank: t.rank,
    start_date: t.startDate, end_date: t.endDate,
    outcome: t.outcome, notes: t.notes,
  }),
  gd_port_callsigns: (s) => ({ id: s.id, group: s.group, number: s.number, officer: s.officer }),
  gd_fto_officers: (o) => ({
    id: o.id, full_name: o.fullName, rank: o.rank, division: o.division,
    fto_level: o.ftoLevel, is_fto: o.isFTO, is_sfto: o.isSFTO,
    is_academy_trainer: o.isAcademyTrainer, is_induction_host: o.isInductionHost,
    is_supervisor: o.isSupervisor, is_leader: o.isLeader,
  }),
};

const tables = [
  { table: 'gd_officers',       file: 'officers.json'       },
  { table: 'gd_certs',          file: 'certs.json'          },
  { table: 'gd_transfers',      file: 'transfers.json'      },
  { table: 'gd_terminations',   file: 'terminations.json'   },
  { table: 'gd_port_trials',    file: 'port_trials.json'    },
  { table: 'gd_port_callsigns', file: 'port_callsigns.json' },
  { table: 'gd_fto_officers',   file: 'fto_officers.json'   },
];

async function seed() {
  console.log('🌱 GDL Database Seed Script\n');
  let totalInserted = 0;

  for (const { table, file } of tables) {
    process.stdout.write(`  ${table.padEnd(24)} `);
    try {
      const raw  = load(file);
      const rows = raw.map(mappers[table]);
      const { error } = await supabase
        .from(table)
        .upsert(rows, { onConflict: 'id' });
      if (error) throw error;
      console.log(`✓  ${rows.length} rows`);
      totalInserted += rows.length;
    } catch (err) {
      console.log(`✗  FAILED — ${err.message}`);
    }
  }

  console.log(`\n✅ Done — ${totalInserted} total rows seeded.`);
}

seed().catch(console.error);
