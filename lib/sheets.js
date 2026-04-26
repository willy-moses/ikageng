// lib/sheets.js — shared Google Sheets client
// Used by all /api routes

const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID; // set in Vercel env vars
const SHEET_NAME     = 'Workers';                   // tab name in your Google Sheet

function getAuth() {
  // Service account key stored as a single JSON env var
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheets() {
  const auth = getAuth();
  return google.sheets({ version: 'v4', auth });
}

// Returns all worker rows as array of objects
async function getWorkers() {
  const sheets = await getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:H`, // skip header row
  });

  const rows = res.data.values || [];
  return rows.map((r, i) => ({
    rowIndex: i + 2,           // 1-based sheet row (row 1 = header)
    id:       r[0] || '',
    first:    r[1] || '',
    last:     r[2] || '',
    dept:     r[3] || '',
    hours:    parseInt(r[4])  || 0,
    wait:     parseInt(r[5])  || 0,
    status:   r[6] || 'Waiting',
    month:    r[7] || '',      // e.g. "2025-03"
  }));
}

// Append a new worker row
async function appendWorker(worker) {
  const sheets = await getSheets();
  const id = 'WK-' + Date.now();
  const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        id,
        worker.first,
        worker.last,
        worker.dept,
        worker.hours || 0,
        worker.wait  || 0,
        worker.status || 'Waiting',
        month,
      ]],
    },
  });
  return id;
}

// Delete a worker row by row index (find by ID first)
async function deleteWorker(workerId) {
  const workers = await getWorkers();
  const target  = workers.find(w => w.id === workerId);
  if (!target) throw new Error('Worker not found');

  const sheets = await getSheets();

  // Get sheet metadata to find the sheetId (gid)
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets.find(s => s.properties.title === SHEET_NAME);
  const sheetId = sheet.properties.sheetId;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId,
            dimension:  'ROWS',
            startIndex: target.rowIndex - 1, // 0-based
            endIndex:   target.rowIndex,
          },
        },
      }],
    },
  });
}

module.exports = { getWorkers, appendWorker, deleteWorker, SHEET_NAME, SPREADSHEET_ID };
