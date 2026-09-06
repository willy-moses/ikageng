// api/workers.js
// GET  /api/workers          → list all workers
// POST /api/workers          → add a worker
// DELETE /api/workers?id=... → remove a worker

const { getWorkers, appendWorker, deleteWorker } = require('../lib/sheets');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // ── GET ──────────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const month = req.query.month; // optional ?month=2025-03
      let workers = await getWorkers();
      if (month) workers = workers.filter(w => w.month === month);
      return res.status(200).json({ ok: true, workers });
    }

    // ── POST ─────────────────────────────────────────────────────────
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body.first || !body.last) {
        return res.status(400).json({ ok: false, error: 'first and last name required' });
      }
      const id = await appendWorker(body);
      return res.status(201).json({ ok: true, id });
    }

    // ── DELETE ────────────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ ok: false, error: 'id required' });
      await deleteWorker(id);
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ ok: false, error: 'Method not allowed' });

  } catch (err) {
    console.error('[/api/workers]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
