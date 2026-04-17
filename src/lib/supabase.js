// src/lib/supabase.js
// Supabase client + typed helpers for all 7 GDL tables.
// Import VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your .env file.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env and fill in your project values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// ─── COLUMN MAPPING ──────────────────────────────────────────────────────────
// The DB uses snake_case; the app uses camelCase.
// These helpers convert between them.

function officerToRow(o) {
  return {
    id:                   o.id,
    steam_name:           o.steamName            ?? '',
    full_name:            o.fullName             ?? '',
    callsign:             o.callsign             ?? '-',
    rank:                 o.rank                 ?? 'Recruit',
    license_class:        o.licenseClass         ?? 'Bronze',
    cert_values:          o.certValues           ?? {},
    last_rp_misconduct:   o.lastRpMisconduct     ?? '',
    hours_warning:        o.hoursWarning         ?? '',
    date_30_hours:        o.date30Hours          ?? '',
    last_promotion_date:  o.lastPromotionDate    ?? '',
    division_join_date:   o.divisionJoinDate     ?? '',
    rank_restriction:     o.rankRestriction      ?? '',
    on_leave:             o.onLeave              ?? 'FALSE',
    expected_return:      o.expectedReturn       ?? '',
    days_on_leave:        o.daysOnLeave          ?? 'FALSE',
  };
}

function rowToOfficer(r) {
  return {
    id:                 r.id,
    steamName:          r.steam_name,
    fullName:           r.full_name,
    callsign:           r.callsign,
    rank:               r.rank,
    licenseClass:       r.license_class,
    certValues:         r.cert_values ?? {},
    lastRpMisconduct:   r.last_rp_misconduct,
    hoursWarning:       r.hours_warning,
    date30Hours:        r.date_30_hours,
    lastPromotionDate:  r.last_promotion_date,
    divisionJoinDate:   r.division_join_date,
    rankRestriction:    r.rank_restriction,
    onLeave:            r.on_leave,
    expectedReturn:     r.expected_return,
    daysOnLeave:        r.days_on_leave,
  };
}

function certToRow(c) {
  return { id: c.id, name: c.name, full_name: c.fullName, order: c.order };
}
function rowToCert(r) {
  return { id: r.id, name: r.name, fullName: r.full_name, order: r.order };
}

function transferToRow(t) {
  return {
    id: t.id, steam_name: t.steamName ?? '', full_name: t.fullName ?? '',
    callsign: t.callsign ?? '-', rank: t.rank ?? '',
    promo_date: t.promoDate ?? '', division: t.division ?? '',
    year: t.year ?? '', notes: t.notes ?? '',
  };
}
function rowToTransfer(r) {
  return {
    id: r.id, steamName: r.steam_name, fullName: r.full_name,
    callsign: r.callsign, rank: r.rank,
    promoDate: r.promo_date, division: r.division,
    year: r.year, notes: r.notes,
  };
}

function terminationToRow(t) {
  return {
    id: t.id, steam_name: t.steamName ?? '', full_name: t.fullName ?? '',
    callsign: t.callsign ?? '-', rank: t.rank ?? '',
    type: t.type ?? '', term_date: t.termDate ?? '',
    reason: t.reason ?? '', year: t.year ?? '',
  };
}
function rowToTermination(r) {
  return {
    id: r.id, steamName: r.steam_name, fullName: r.full_name,
    callsign: r.callsign, rank: r.rank,
    type: r.type, termDate: r.term_date,
    reason: r.reason, year: r.year,
  };
}

function portTrialToRow(t) {
  return {
    id: t.id, name: t.name ?? '', rank: t.rank ?? '',
    start_date: t.startDate ?? '', end_date: t.endDate ?? '',
    outcome: t.outcome ?? 'In Progress', notes: t.notes ?? '',
  };
}
function rowToPortTrial(r) {
  return {
    id: r.id, name: r.name, rank: r.rank,
    startDate: r.start_date, endDate: r.end_date,
    outcome: r.outcome, notes: r.notes,
  };
}

function portCSToRow(s) {
  return { id: s.id, group: s.group, number: s.number, officer: s.officer ?? '' };
}
function rowToPortCS(r) {
  return { id: r.id, group: r.group, number: r.number, officer: r.officer };
}

function ftoToRow(o) {
  return {
    id: o.id, full_name: o.fullName ?? '', rank: o.rank ?? '',
    division: o.division ?? '', fto_level: o.ftoLevel ?? 'FTO',
    is_fto: o.isFTO ?? 'N', is_sfto: o.isSFTO ?? 'N',
    is_academy_trainer: o.isAcademyTrainer ?? 'N',
    is_induction_host: o.isInductionHost ?? 'N',
    is_supervisor: o.isSupervisor ?? 'N',
    is_leader: o.isLeader ?? 'N',
  };
}
function rowToFTO(r) {
  return {
    id: r.id, fullName: r.full_name, rank: r.rank,
    division: r.division, ftoLevel: r.fto_level,
    isFTO: r.is_fto, isSFTO: r.is_sfto,
    isAcademyTrainer: r.is_academy_trainer,
    isInductionHost: r.is_induction_host,
    isSupervisor: r.is_supervisor,
    isLeader: r.is_leader,
  };
}

// ─── GENERIC FETCH / UPSERT / DELETE ────────────────────────────────────────

async function fetchAll(table, transform) {
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return (data ?? []).map(transform);
}

async function upsertRow(table, row) {
  const { error } = await supabase.from(table).upsert(row, { onConflict: 'id' });
  if (error) throw error;
}

async function upsertRows(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

// ─── PUBLIC API ──────────────────────────────────────────────────────────────

// Officers
export const db = {
  officers: {
    getAll:  ()           => fetchAll('gd_officers', rowToOfficer),
    upsert:  (o)          => upsertRow('gd_officers', officerToRow(o)),
    upsertMany: (arr)     => upsertRows('gd_officers', arr.map(officerToRow)),
    delete:  (id)         => deleteRow('gd_officers', id),
  },
  certs: {
    getAll:  ()           => fetchAll('gd_certs', rowToCert),
    upsert:  (c)          => upsertRow('gd_certs', certToRow(c)),
    upsertMany: (arr)     => upsertRows('gd_certs', arr.map(certToRow)),
    delete:  (id)         => deleteRow('gd_certs', id),
  },
  transfers: {
    getAll:  ()           => fetchAll('gd_transfers', rowToTransfer),
    upsert:  (t)          => upsertRow('gd_transfers', transferToRow(t)),
    upsertMany: (arr)     => upsertRows('gd_transfers', arr.map(transferToRow)),
    delete:  (id)         => deleteRow('gd_transfers', id),
  },
  terminations: {
    getAll:  ()           => fetchAll('gd_terminations', rowToTermination),
    upsert:  (t)          => upsertRow('gd_terminations', terminationToRow(t)),
    upsertMany: (arr)     => upsertRows('gd_terminations', arr.map(terminationToRow)),
    delete:  (id)         => deleteRow('gd_terminations', id),
  },
  portTrials: {
    getAll:  ()           => fetchAll('gd_port_trials', rowToPortTrial),
    upsert:  (t)          => upsertRow('gd_port_trials', portTrialToRow(t)),
    upsertMany: (arr)     => upsertRows('gd_port_trials', arr.map(portTrialToRow)),
    delete:  (id)         => deleteRow('gd_port_trials', id),
  },
  portCallsigns: {
    getAll:  ()           => fetchAll('gd_port_callsigns', rowToPortCS),
    upsert:  (s)          => upsertRow('gd_port_callsigns', portCSToRow(s)),
    upsertMany: (arr)     => upsertRows('gd_port_callsigns', arr.map(portCSToRow)),
    delete:  (id)         => deleteRow('gd_port_callsigns', id),
  },
  ftoOfficers: {
    getAll:  ()           => fetchAll('gd_fto_officers', rowToFTO),
    upsert:  (o)          => upsertRow('gd_fto_officers', ftoToRow(o)),
    upsertMany: (arr)     => upsertRows('gd_fto_officers', arr.map(ftoToRow)),
    delete:  (id)         => deleteRow('gd_fto_officers', id),
  },
};
