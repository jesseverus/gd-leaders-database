#!/usr/bin/env node
// scripts/export.js
// Exports the current Supabase database state to src/data/*.json
// Useful for ad-hoc edits: edit the JSON, then re-run `npm run seed`
//
// Run with:  npm run export
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __dir  = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '../src/data');
mkdirSync(outDir, { recursive: true });

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

// Row → camelCase mappers
const toApp = {
  gd_officers: (r) => ({
    id: r.id, steamName: r.steam_name, fullName: r.full_name,
    callsign: r.callsign, rank: r.rank, licenseClass: r.license_class,
    certValues: r.cert_values, lastRpMisconduct: r.last_rp_misconduct,
    hoursWarning: r.hours_warning, date30Hours: r.date_30_hours,
    lastPromotionDate: r.last_promotion_date, divisionJoinDate: r.division_join_date,
    rankRestriction: r.rank_restriction, onLeave: r.on_leave,
    expectedReturn: r.expected_return, daysOnLeave: r.days_on_leave,
  }),
  gd_certs: (r) => ({ id: r.id, name: r.name, fullName: r.full_name, order: r.order }),
  gd_transfers: (r) => ({
    id: r.id, steamName: r.steam_name, fullName: r.full_name,
    callsign: r.callsign, rank: r.rank, promoDate: r.promo_date,
    division: r.division, year: r.year, notes: r.notes,
  }),
  gd_terminations: (r) => ({
    id: r.id, steamName: r.steam_name, fullName: r.full_name,
    callsign: r.callsign, rank: r.rank, type: r.type,
    termDate: r.term_date, reason: r.reason, year: r.year,
  }),
  gd_port_trials: (r) => ({
    id: r.id, name: r.name, rank: r.rank,
    startDate: r.start_date, endDate: r.end_date,
    outcome: r.outcome, notes: r.notes,
  }),
  gd_port_callsigns: (r) => ({ id: r.id, group: r.group, number: r.number, officer: r.officer }),
  gd_fto_officers: (r) => ({
    id: r.id, fullName: r.full_name, rank: r.rank, division: r.division,
    ftoLevel: r.fto_level, isFTO: r.is_fto, isSFTO: r.is_sfto,
    isAcademyTrainer: r.is_academy_trainer, isInductionHost: r.is_induction_host,
    isSupervisor: r.is_supervisor, isLeader: r.is_leader,
  }),
};

const files = {
  gd_officers:       'officers.json',
  gd_certs:          'certs.json',
  gd_transfers:      'transfers.json',
  gd_terminations:   'terminations.json',
  gd_port_trials:    'port_trials.json',
  gd_port_callsigns: 'port_callsigns.json',
  gd_fto_officers:   'fto_officers.json',
};

async function exportDB() {
  console.log('📤 GDL Database Export Script\n');
  const timestamp = new Date().toISOString().slice(0, 10);

  for (const [table, file] of Object.entries(files)) {
    process.stdout.write(`  ${table.padEnd(24)} → src/data/${file}  `);
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) throw error;
      const mapped = (data ?? []).map(toApp[table]);
      writeFileSync(join(outDir, file), JSON.stringify(mapped, null, 2));
      console.log(`✓  ${mapped.length} rows`);
    } catch (err) {
      console.log(`✗  FAILED — ${err.message}`);
    }
  }

  console.log(`\n✅ Export complete (${timestamp})`);
  console.log('   Edit src/data/*.json then run `npm run seed` to push changes back.');
}

exportDB().catch(console.error);
