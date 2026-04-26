// api/months.js
// GET /api/months → returns distinct YYYY-MM values from the sheet
// Used by the frontend month selector

const { getWorkers } = require('../lib/sheets');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const workers = await getWorkers();
    const months  = [...new Set(workers.map(w => w.month).filter(Boolean))].sort().reverse();
    res.status(200).json({ ok: true, months });
  } catch (err) {
    console.error('[/api/months]', err);
    res.status(500).json({ ok: false, error: err.message });
  }
};
