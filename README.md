# Ikageng Worker Waiting List
**Stack:** Excel file (`.xlsx`) on server · Node.js + Express · Vercel

---

## Architecture

```
Browser  ──fetch──►  Express (server.js)  ──xlsx──►  data/workers.xlsx
```

All worker data lives in a single Excel file on the server.  
On Vercel, writes go to `/tmp/workers.xlsx` (persists within a session).  
For permanent persistence across deployments, see the **Persistence Note** below.

---

## Quick Start (Local)

```bash
# 1. Install dependencies
npm install

# 2. Run locally
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

No environment variables needed for basic use.

---

## Project Structure

```
ikageng/
├── server.js          ← Express app + all API routes
├── data/
│   └── workers.xlsx   ← Seed Excel file (your database)
├── public/
│   └── index.html     ← Frontend
├── package.json
├── vercel.json
└── README.md
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/workers` | List all workers |
| GET | `/api/workers?month=YYYY-MM` | Filter by month |
| POST | `/api/workers` | Add a worker |
| PUT | `/api/workers/:id` | Update a worker (hours, status, etc.) |
| DELETE | `/api/workers/:id` | Remove a worker |
| GET | `/api/months` | List distinct months in the file |
| GET | `/api/export?month=YYYY-MM` | Download filtered Excel file |

---

## Excel File Format

The `data/workers.xlsx` file has one sheet called **Workers** with these columns:

| id | first | last | dept | hours | wait | status | month |
|----|-------|------|------|-------|------|--------|-------|
| WK-001 | Tebogo | Mokoena | Construction | 192 | 45 | Waiting | 2026-03 |

You can edit this file directly in Excel — just keep the column names in row 1.

---

## Priority Score Formula

```
Score (0–100) =
  (1 - hours / 250) × 60    ← fewer hours = higher need
+ (wait  / 120) × 40        ← longer wait = higher priority
```

Workers with the **lowest previous-month hours** and **longest wait time** rank highest.

---

## Monthly Workflow

1. Each month, add new worker rows via the app (or edit `workers.xlsx` directly)
2. The `month` column (format: `YYYY-MM`) is set automatically to the current month
3. Use the **Reference Month** dropdown to view and sort any past month
4. Use **Export Excel** to download a filtered copy for that month

---

## ⚠ Persistence Note on Vercel

Vercel serverless functions are **stateless** — the filesystem resets between cold starts.  
The app copies `data/workers.xlsx` to `/tmp/workers.xlsx` on first run, so writes work  
within a session, but data may reset after a new deployment or inactivity.

**Options for permanent persistence:**
- **Vercel Blob** — store the `.xlsx` file in Vercel's object storage (recommended)
- **Supabase / PlanetScale** — migrate to a proper database
- **GitHub commit on write** — push the updated file back to your repo on every write
- **Self-host** — run on a VPS (Railway, Render, Fly.io) where the filesystem persists

For a small team with infrequent writes, the current setup works fine.
