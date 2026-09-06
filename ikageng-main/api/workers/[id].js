// api/workers/[id].js
// DELETE /api/workers/:id  — delete a row by worker ID value in column A

import axios from 'axios';
import { getGraphToken, workbookBase, verifyToken } from '../_graph.js';

const SHEET = process.env.EXCEL_SHEET_NAME || 'Workers';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!verifyToken(req.headers.authorization)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  const { id } = req.query;

  try {
    const token   = await getGraphToken();
    const base    = workbookBase();
    const headers = { Authorization: `Bearer ${token}` };

    // Try named Table first
    let deleted = false;
    try {
      const rowsResp = await axios.get(`${base}/tables/${SHEET}/rows`, { headers });
      const rows = rowsResp.data.value;
      const target = rows.find(r => String(r.values[0][0]) === id);
      if (target) {
        await axios.delete(`${base}/tables/${SHEET}/rows/${target.index}`, { headers });
        deleted = true;
      }
    } catch {
      // fall through to sheet range method
    }

    if (!deleted) {
      // Fall back: scan used range
      const rangeResp = await axios.get(
        `${base}/worksheets/${SHEET}/usedRange(valuesOnly=true)`,
        { headers }
      );
      const rows = rangeResp.data.values;
      const rowIdx = rows.findIndex((r, i) => i > 0 && String(r[0]) === id);
      if (rowIdx === -1) return res.status(404).json({ error: 'Worker not found' });

      // Delete the row by shifting: clear it then use row delete via range
      const excelRow = rowIdx + 1; // 1-indexed, +1 for header
      await axios.post(
        `${base}/worksheets/${SHEET}/range(address='A${excelRow}:H${excelRow}')/delete`,
        { shift: 'Up' },
        { headers }
      );
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error('[delete worker]', err?.response?.data || err.message);
    return res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
}
