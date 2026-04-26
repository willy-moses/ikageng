// server.js — Ikageng Waiting List API
// Reads and writes workers.xlsx stored in /data/
// Deployed as a single Vercel serverless function

const express = require('express');
const cors    = require('cors');
const XLSX    = require('xlsx');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Paths ────────────────────────────────────────────────────────────────────
// On Vercel, /tmp is the only writable directory at runtime.
// We copy the seed file there on first run so writes persist within a session.
// For persistent storage across deployments, replace /tmp with an external
// store (e.g. Vercel Blob, Supabase, or a mounted volume).
const SEED_PATH = path.join(__dirname, 'data', 'workers.xlsx');
const DATA_PATH = process.env.VERCEL ? '/tmp/workers.xlsx' : SEED_PATH;

function ensureFile() {
  if (!fs.existsSync(DATA_PATH)) {
    if (fs.existsSync(SEED_PATH)) {
      fs.copyFileSync(SEED_PATH, DATA_PATH);
    } else {
      // Create a blank workbook with headers
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([[
        'id','first','last','dept','hours','wait','status','month'
      ]]);
      XLSX.utils.book_append_sheet(wb, ws, 'Workers');
      XLSX.writeFile(wb, DATA_PATH);
    }
  }
}

// ── Excel helpers ────────────────────────────────────────────────────────────
function readWorkers() {
  ensureFile();
  const wb   = XLSX.readFile(DATA_PATH);
  const ws   = wb.Sheets['Workers'];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows.map(r => ({
    id:     String(r.id     || ''),
    first:  String(r.first  || ''),
    last:   String(r.last   || ''),
    dept:   String(r.dept   || ''),
    hours:  Number(r.hours) || 0,
    wait:   Number(r.wait)  || 0,
    status: String(r.status || 'Waiting'),
    month:  String(r.month  || ''),
  }));
}

function writeWorkers(workers) {
  ensureFile();
  const wb = XLSX.readFile(DATA_PATH);
  const ws = XLSX.utils.json_to_sheet(workers, {
    header: ['id','first','last','dept','hours','wait','status','month'],
  });
  wb.Sheets['Workers'] = ws;
  XLSX.writeFile(wb, DATA_PATH);
}

function genId() {
  return 'WK-' + Date.now();
}

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "YYYY-MM"
}

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── API: Workers ─────────────────────────────────────────────────────────────

// GET /api/workers?month=YYYY-MM
app.get('/api/workers', (req, res) => {
  try {
    let workers = readWorkers();
    if (req.query.month) {
      workers = workers.filter(w => w.month === req.query.month);
    }
    res.json({ ok: true, workers });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// POST /api/workers — add a new worker
app.post('/api/workers', (req, res) => {
  try {
    const { first, last, dept, hours, wait, status } = req.body;
    if (!first || !last) return res.status(400).json({ ok: false, error: 'first and last name required' });

    const workers = readWorkers();
    const newWorker = {
      id:     genId(),
      first:  first.trim(),
      last:   last.trim(),
      dept:   dept   || 'Construction',
      hours:  Number(hours) || 0,
      wait:   Number(wait)  || 0,
      status: status || 'Waiting',
      month:  currentMonth(),
    };
    workers.push(newWorker);
    writeWorkers(workers);
    res.status(201).json({ ok: true, worker: newWorker });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// PUT /api/workers/:id — update a worker (e.g. change hours/status)
app.put('/api/workers/:id', (req, res) => {
  try {
    const workers = readWorkers();
    const idx     = workers.findIndex(w => w.id === req.params.id);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'Worker not found' });

    const allowed = ['first','last','dept','hours','wait','status'];
    allowed.forEach(key => {
      if (req.body[key] !== undefined) workers[idx][key] = req.body[key];
    });
    writeWorkers(workers);
    res.json({ ok: true, worker: workers[idx] });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// DELETE /api/workers/:id
app.delete('/api/workers/:id', (req, res) => {
  try {
    const workers = readWorkers();
    const filtered = workers.filter(w => w.id !== req.params.id);
    if (filtered.length === workers.length) {
      return res.status(404).json({ ok: false, error: 'Worker not found' });
    }
    writeWorkers(filtered);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/months — distinct months in the file
app.get('/api/months', (req, res) => {
  try {
    const workers = readWorkers();
    const months  = [...new Set(workers.map(w => w.month).filter(Boolean))].sort().reverse();
    res.json({ ok: true, months });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// GET /api/export?month=YYYY-MM — download the Excel file
app.get('/api/export', (req, res) => {
  try {
    let workers = readWorkers();
    if (req.query.month) workers = workers.filter(w => w.month === req.query.month);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(workers, {
      header: ['id','first','last','dept','hours','wait','status','month'],
    });
    XLSX.utils.book_append_sheet(wb, ws, 'Workers');

    const buf      = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = req.query.month ? `ikageng_${req.query.month}.xlsx` : 'ikageng_all.xlsx';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ── Fallback → serve frontend ─────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => console.log(`Ikageng API running on http://localhost:${PORT}`));
}

module.exports = app;
