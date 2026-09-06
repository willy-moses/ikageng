// api/login.js
// Simple password auth — password stored in ADMIN_PASSWORD env variable

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body;
  const correct = process.env.ADMIN_PASSWORD;

  if (!correct) {
    return res.status(500).json({ error: 'ADMIN_PASSWORD env variable not set.' });
  }

  if (password === correct) {
    // Return a simple signed token (timestamp + hash-ish)
    // For production, replace with JWT (jsonwebtoken package)
    const token = Buffer.from(`ikageng:${Date.now()}:${correct}`).toString('base64');
    return res.status(200).json({ ok: true, token });
  }

  return res.status(401).json({ error: 'Incorrect password.' });
}
