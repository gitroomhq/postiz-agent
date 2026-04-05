import { createServer, IncomingMessage, ServerResponse } from 'http';
import { URL } from 'url';
import { randomBytes } from 'crypto';
import fetch from 'node-fetch';
import pg from 'pg';

// --- Configuration ---
const PORT = parseInt(process.env.PORT || '3111', 10);
const CLIENT_ID = process.env.POSTIZ_OAUTH_CLIENT_ID!;
const CLIENT_SECRET = process.env.POSTIZ_OAUTH_CLIENT_SECRET!;
const FRONTEND_URL = process.env.POSTIZ_FRONTEND_URL || 'https://platform.postiz.com';
const API_URL = process.env.POSTIZ_API_URL || 'https://api.postiz.com';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`;
const DATABASE_URL = process.env.DATABASE_URL!;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('POSTIZ_OAUTH_CLIENT_ID and POSTIZ_OAUTH_CLIENT_SECRET are required');
  process.exit(1);
}

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

// --- Postgres ---
const pool = new pg.Pool({ connectionString: DATABASE_URL });

const EXPIRY_MINUTES = 15;
const POLL_INTERVAL_S = 5;
const MAX_BODY_BYTES = 4096;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS device_requests (
      device_code TEXT PRIMARY KEY,
      user_code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      access_token TEXT,
      api_url TEXT,
      organization_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_device_requests_user_code
    ON device_requests (user_code) WHERE status = 'pending'
  `);
  // Clean up any stale rows on startup
  await pool.query(
    `DELETE FROM device_requests WHERE created_at < NOW() - INTERVAL '${EXPIRY_MINUTES} minutes'`
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code.slice(0, 4) + '-' + code.slice(4);
}

function json(res: ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function html(res: ServerResponse, status: number, body: string) {
  res.writeHead(status, { 'Content-Type': 'text/html' });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Postiz CLI Auth</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0a;color:#fff}.card{background:#141414;border:1px solid #262626;border-radius:12px;padding:48px;max-width:480px;text-align:center}h2{margin-bottom:16px;font-size:24px}p{color:#a0a0a0;margin-bottom:24px;line-height:1.5}.code{font-family:monospace;font-size:36px;font-weight:bold;letter-spacing:4px;background:#1a1a2e;border:1px solid #333;border-radius:8px;padding:16px 32px;display:inline-block;margin:16px 0;color:#7c3aed}.btn{display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-size:16px;font-weight:500;border:none;cursor:pointer}.btn:hover{background:#6d28d9}.success{color:#22c55e}.error{color:#ef4444}</style></head><body><div class="card">${body}</div></body></html>`);
}

async function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error('Body too large'));
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

// --- Route handlers ---

// POST /device/code — CLI calls this to start the flow
async function handleDeviceCode(_req: IncomingMessage, res: ServerResponse) {
  const deviceCode = randomBytes(32).toString('hex');
  const userCode = generateUserCode();

  await pool.query(
    'INSERT INTO device_requests (device_code, user_code) VALUES ($1, $2)',
    [deviceCode, userCode]
  );

  json(res, 200, {
    device_code: deviceCode,
    user_code: userCode,
    verification_uri: `${SERVER_URL}/device/verify`,
    expires_in: EXPIRY_MINUTES * 60,
    interval: POLL_INTERVAL_S,
  });
}

// GET /device/verify — User opens this in browser, sees the code entry page
function handleVerifyPage(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', SERVER_URL);
  const prefilled = escapeHtml(url.searchParams.get('code') || '');

  html(res, 200, `
    <h2>Postiz CLI Authorization</h2>
    <p>Enter the code shown in your terminal:</p>
    <form method="POST" action="/device/verify">
      <input type="text" name="user_code" value="${prefilled}" placeholder="XXXX-XXXX"
        style="font-family:monospace;font-size:24px;text-align:center;padding:12px 24px;border-radius:8px;border:1px solid #333;background:#1a1a2e;color:#fff;letter-spacing:4px;width:260px;margin-bottom:24px;text-transform:uppercase"
        maxlength="9" autofocus required>
      <br>
      <button type="submit" class="btn">Authorize</button>
    </form>
  `);
}

// POST /device/verify — User submits code, we redirect to OAuth
async function handleVerifySubmit(req: IncomingMessage, res: ServerResponse) {
  const body = await parseBody(req);
  const params = new URLSearchParams(body);
  const userCode = params.get('user_code')?.toUpperCase().trim();

  if (!userCode) {
    html(res, 400, '<h2 class="error">Missing code</h2><p>Please go back and enter the code.</p>');
    return;
  }

  const result = await pool.query(
    `SELECT device_code FROM device_requests
     WHERE user_code = $1 AND status = 'pending'
     AND created_at > NOW() - INTERVAL '${EXPIRY_MINUTES} minutes'
     LIMIT 1`,
    [userCode]
  );

  if (result.rows.length === 0) {
    html(res, 400, '<h2 class="error">Invalid or expired code</h2><p>The code was not found or has expired. Please try again from the CLI.</p>');
    return;
  }

  const deviceCode = result.rows[0].device_code;

  // Redirect to Postiz OAuth with device_code in state so we can match on callback
  const authorizeUrl = `${FRONTEND_URL}/oauth/authorize?client_id=${encodeURIComponent(CLIENT_ID)}&response_type=code&state=${encodeURIComponent(deviceCode)}`;

  res.writeHead(302, { Location: authorizeUrl });
  res.end();
}

// GET /device/callback — Postiz redirects here after OAuth authorization
async function handleOAuthCallback(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url || '/', SERVER_URL);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state'); // this is the device_code
  const error = url.searchParams.get('error');

  if (error) {
    html(res, 400, `<h2 class="error">Authorization denied</h2><p>${escapeHtml(error)}</p><p>You can close this window.</p>`);
    return;
  }

  if (!code || !state) {
    html(res, 400, '<h2 class="error">Missing parameters</h2><p>Invalid callback.</p>');
    return;
  }

  const result = await pool.query(
    `SELECT device_code FROM device_requests
     WHERE device_code = $1 AND status = 'pending'
     AND created_at > NOW() - INTERVAL '${EXPIRY_MINUTES} minutes'`,
    [state]
  );

  if (result.rows.length === 0) {
    html(res, 400, '<h2 class="error">Invalid or expired session</h2><p>Please try again from the CLI.</p>');
    return;
  }

  // Exchange authorization code for access token
  try {
    const tokenResponse = await fetch(`${API_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      html(res, 500, `<h2 class="error">Token exchange failed</h2><p>${escapeHtml(errText)}</p>`);
      return;
    }

    const tokenData = (await tokenResponse.json()) as any;

    await pool.query(
      `UPDATE device_requests
       SET status = 'completed', access_token = $1, api_url = $2, organization_id = $3
       WHERE device_code = $4`,
      [tokenData.access_token, API_URL, tokenData.id || null, state]
    );

    html(res, 200, '<h2 class="success">Authorization successful!</h2><p>You can close this window and return to your terminal.</p>');
  } catch (err: any) {
    html(res, 500, `<h2 class="error">Error</h2><p>${escapeHtml(err.message)}</p>`);
  }
}

// POST /device/token — CLI polls this to check if user completed auth
async function handleDeviceToken(req: IncomingMessage, res: ServerResponse) {
  const body = await parseBody(req);
  let deviceCode: string | undefined;

  try {
    const parsed = JSON.parse(body);
    deviceCode = parsed.device_code;
  } catch {
    json(res, 400, { error: 'invalid_request' });
    return;
  }

  if (!deviceCode) {
    json(res, 400, { error: 'invalid_request' });
    return;
  }

  const result = await pool.query(
    'SELECT status, access_token, api_url, organization_id, created_at FROM device_requests WHERE device_code = $1',
    [deviceCode]
  );

  if (result.rows.length === 0) {
    json(res, 400, { error: 'invalid_device_code' });
    return;
  }

  const row = result.rows[0];
  const ageMs = Date.now() - new Date(row.created_at).getTime();

  if (ageMs > EXPIRY_MINUTES * 60 * 1000) {
    await pool.query('DELETE FROM device_requests WHERE device_code = $1', [deviceCode]);
    json(res, 400, { error: 'expired_token' });
    return;
  }

  if (row.status === 'pending') {
    json(res, 400, { error: 'authorization_pending' });
    return;
  }

  // Completed — return token and clean up
  await pool.query('DELETE FROM device_requests WHERE device_code = $1', [deviceCode]);

  json(res, 200, {
    access_token: row.access_token,
    api_url: row.api_url,
    organization_id: row.organization_id,
  });
}

// --- Server ---
const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', SERVER_URL);
  const method = req.method?.toUpperCase();

  try {
    if (method === 'POST' && url.pathname === '/device/code') {
      await handleDeviceCode(req, res);
    } else if (method === 'GET' && url.pathname === '/device/verify') {
      handleVerifyPage(req, res);
    } else if (method === 'POST' && url.pathname === '/device/verify') {
      await handleVerifySubmit(req, res);
    } else if (method === 'GET' && url.pathname === '/device/callback') {
      await handleOAuthCallback(req, res);
    } else if (method === 'POST' && url.pathname === '/device/token') {
      await handleDeviceToken(req, res);
    } else if (url.pathname === '/health') {
      json(res, 200, { status: 'ok' });
    } else {
      json(res, 404, { error: 'not_found' });
    }
  } catch (err: any) {
    console.error('Unhandled error:', err);
    json(res, 500, { error: 'internal_error' });
  }
});

async function start() {
  await initDb();

  // Clean up expired rows every 10 minutes
  setInterval(async () => {
    try {
      await pool.query(
        `DELETE FROM device_requests WHERE created_at < NOW() - INTERVAL '${EXPIRY_MINUTES} minutes'`
      );
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  }, 10 * 60 * 1000);

  server.listen(PORT, () => {
    console.log(`Postiz CLI auth server running on ${SERVER_URL}`);
    console.log(`OAuth callback URL (configure in Postiz): ${SERVER_URL}/device/callback`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
