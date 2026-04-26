// api/_graph.js  — shared Microsoft Graph API helper
// Called by workers.js to get a fresh access token via client credentials flow

import axios from 'axios';

/**
 * Get an access token using Azure App client credentials.
 * Requires env vars:
 *   AZURE_TENANT_ID
 *   AZURE_CLIENT_ID
 *   AZURE_CLIENT_SECRET
 */
export async function getGraphToken() {
  const { AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET } = process.env;

  if (!AZURE_TENANT_ID || !AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
    throw new Error('Missing Azure env variables: AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  }

  const url = `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    grant_type:    'client_credentials',
    client_id:     AZURE_CLIENT_ID,
    client_secret: AZURE_CLIENT_SECRET,
    scope:         'https://graph.microsoft.com/.default',
  });

  const resp = await axios.post(url, params.toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return resp.data.access_token;
}

/**
 * Build Graph API base URL for the Excel workbook.
 * Requires env vars:
 *   ONEDRIVE_USER_ID   — the OneDrive user's email or object ID
 *   EXCEL_FILE_ID      — the Drive item ID of the .xlsx file
 *   EXCEL_SHEET_NAME   — the worksheet/table name (default: "Workers")
 */
export function workbookBase() {
  const { ONEDRIVE_USER_ID, EXCEL_FILE_ID } = process.env;
  if (!ONEDRIVE_USER_ID || !EXCEL_FILE_ID) {
    throw new Error('Missing env variables: ONEDRIVE_USER_ID, EXCEL_FILE_ID');
  }
  return `https://graph.microsoft.com/v1.0/users/${ONEDRIVE_USER_ID}/drive/items/${EXCEL_FILE_ID}/workbook`;
}

/**
 * Verify the simple base64 token issued by /api/login
 */
export function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  try {
    const decoded = Buffer.from(authHeader.slice(7), 'base64').toString('utf8');
    const [prefix, , password] = decoded.split(':');
    return prefix === 'ikageng' && password === process.env.ADMIN_PASSWORD;
  } catch {
    return false;
  }
}
