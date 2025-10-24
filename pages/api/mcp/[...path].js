// Proxy API route to forward requests from Next.js to the MCP server.
// This lets the Next app call /api/mcp/... and keeps MCP_API_KEY on the server side.

const MCP_URL = process.env.MCP_URL || 'http://localhost:4000';
const MCP_API_KEY = process.env.MCP_API_KEY;

export default async function handler(req, res) {
  const pathParts = req.query.path || [];
  const path = Array.isArray(pathParts) ? pathParts.join('/') : pathParts;
  // Preserve query string
  const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
  const target = `${MCP_URL}/${path}${qs}`;

  const headers = { 'Content-Type': 'application/json' };
  if (MCP_API_KEY) headers['x-api-key'] = MCP_API_KEY;

  try {
    const fetchOpts = { method: req.method, headers };
    if (req.body && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const r = await fetch(target, fetchOpts);
  const text = await r.text();
  // Forward status and Content-Type header if present
  res.status(r.status);
  const contentType = r.headers.get('content-type');
  if (contentType) res.setHeader('Content-Type', contentType);
  res.send(text);
  } catch (err) {
    console.error('MCP proxy error:', err.message);
    res.status(500).json({ error: 'proxy_error', details: err.message });
  }
}
