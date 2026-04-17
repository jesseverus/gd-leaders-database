# GD Leaders Database

Internal personnel management tool for the BBRP Melbourne Police Department FiveM roleplay server.

**Password protected** — access code required at login (default: `burnbook`, change via `VITE_APP_PASSWORD`).

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 18 + Vite                   |
| Database | Supabase (Postgres + REST API)    |
| Hosting  | GitHub Pages / Vercel / Netlify   |
| Data     | JSON seed files in `src/data/`    |

---

## Quick Start

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/gd-leaders-database.git
cd gd-leaders-database
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Give it a name (e.g. `gd-leaders`) and set a database password
3. Wait for it to provision (~1 min)

### 3. Run the Database Migration

In the Supabase Dashboard → **SQL Editor**, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

This creates all 7 tables with the correct columns and RLS policies.

### 4. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase project values (found in Dashboard → Project Settings → API):

```env
VITE_SUPABASE_URL=https://abcdefgh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_URL=https://abcdefgh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
VITE_APP_PASSWORD=burnbook
```

### 5. Seed the Database

```bash
npm run seed
```

This reads all `src/data/*.json` files and upserts them into Supabase.
Safe to run multiple times — it uses `upsert` with `onConflict: 'id'`.

### 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deployment

### Vercel (recommended — zero config)

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add your environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_APP_PASSWORD`
4. Deploy — done

### Netlify

1. Push to GitHub
2. Import at [netlify.com](https://netlify.com) → Build command: `npm run build`, Publish dir: `dist`
3. Add the same environment variables in Site Settings → Environment Variables
4. Add a `_redirects` file in `public/`:
   ```
   /* /index.html 200
   ```

### GitHub Pages

GitHub Pages doesn't support environment variables at build time by default.
Use GitHub Actions with secrets instead:

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
          VITE_APP_PASSWORD: ${{ secrets.VITE_APP_PASSWORD }}
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

Add the three secrets in your repo → Settings → Secrets and variables → Actions.

---

## Data Management

### JSON Seed Files

All initial data lives in `src/data/` as plain JSON files:

| File                   | Records | Description                        |
|------------------------|---------|------------------------------------|
| `officers.json`        | 54      | Active GD roster                   |
| `certs.json`           | 8       | Certification column definitions   |
| `transfers.json`       | 39      | Divisional transfers 2025–2026     |
| `terminations.json`    | 22      | Terminations & resignations 2026   |
| `port_trials.json`     | 82      | PORT trial period entries          |
| `port_callsigns.json`  | 109     | PORT callsign assignments          |
| `fto_officers.json`    | 65      | FTO database                       |

These files are the **source of truth** for seeding. You can edit them directly in any text editor (valid JSON, one object per record) and then re-run `npm run seed`.

### Exporting the Current Database to JSON

```bash
npm run export
```

This fetches the current Supabase state and overwrites the JSON files in `src/data/`. Use this to:
- Create a point-in-time snapshot
- Make bulk edits in a text editor
- Commit the latest data to git

### In-App Export/Import

The **⬇ Export** button in the app header downloads a full JSON backup of all 7 tables.  
The **⬆ Import** button restores from a previously exported backup.

Both work through the browser — no scripts needed.

---

## Project Structure

```
gd-leaders-database/
├── index.html                    # HTML entry point
├── vite.config.js                # Vite + React config
├── package.json
├── .env.example                  # ← copy to .env
├── .gitignore
│
├── src/
│   ├── main.jsx                  # React root
│   ├── App.jsx                   # App shell + tab routing
│   │
│   ├── lib/
│   │   ├── supabase.js           # Supabase client + table helpers
│   │   └── utils.js              # Constants, helpers, theme tokens
│   │
│   ├── hooks/
│   │   └── useDb.js              # Data hook (load from Supabase, auto-seed)
│   │
│   ├── components/
│   │   ├── ui.jsx                # Btn, Modal, TxtCell, DropCell, DateCell, badges
│   │   ├── LoginScreen.jsx
│   │   ├── GDTable.jsx           # Tab 1 — GD Roster
│   │   ├── TransfersTab.jsx      # Tab 2 — Divisional Transfers
│   │   ├── TerminationsTab.jsx   # Tab 3 — Terminations & Resignations
│   │   ├── PortTrialTab.jsx      # Tab 4 — PORT Trial Period
│   │   ├── PortCallsignsTab.jsx  # Tab 5 — PORT Callsigns
│   │   ├── FTOTab.jsx            # Tab 6 — FTO Database
│   │   └── modals/
│   │       ├── AddOfficerModal.jsx
│   │       └── AddCertModal.jsx
│   │
│   └── data/                     # ← JSON seed files (editable)
│       ├── officers.json
│       ├── certs.json
│       ├── transfers.json
│       ├── terminations.json
│       ├── port_trials.json
│       ├── port_callsigns.json
│       └── fto_officers.json
│
├── scripts/
│   ├── seed.js                   # npm run seed  — JSON → Supabase
│   └── export.js                 # npm run export — Supabase → JSON
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql  # Run this first in Supabase SQL editor
        └── 002_seed.sql            # Reference only — use npm run seed instead
```

---

## Changing the App Password

Either:
- Set `VITE_APP_PASSWORD=yournewpassword` in `.env` (and in your hosting platform's env vars), or
- Edit the default fallback in `src/App.jsx`: `const AUTH_PW = import.meta.env.VITE_APP_PASSWORD ?? 'burnbook'`

---

## Adding a New Officer Manually via JSON

1. Open `src/data/officers.json`
2. Add a new object following the existing pattern, with a unique `id` (any string)
3. Run `npm run seed` to push it to Supabase

Example:
```json
{
  "id": "o55",
  "steamName": "NewPlayer",
  "fullName": "John Smith",
  "callsign": "-",
  "rank": "Recruit",
  "licenseClass": "Bronze",
  "certValues": { "fto":"", "airwing":"", "rcv":"", "port":"", "k9":"", "ciu":"", "cso":"", "oc":"" },
  "lastRpMisconduct": "",
  "hoursWarning": "",
  "date30Hours": "",
  "lastPromotionDate": "2026-04-17",
  "divisionJoinDate": "2026-04-17",
  "rankRestriction": "",
  "onLeave": "FALSE",
  "expectedReturn": "",
  "daysOnLeave": "FALSE"
}
```
