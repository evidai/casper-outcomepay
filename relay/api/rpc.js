// CORS relay for Casper Testnet JSON-RPC (browser -> this relay -> node).
// No secrets, no state. Forwards ONLY to the fixed testnet node below.
// Exists because public Casper nodes don't send CORS headers, so the static
// GitHub Pages app (evidai.github.io/casper-outcomepay) can't call them directly.

const UPSTREAM = "https://node.testnet.casper.network/rpc";
const ALLOWED_ORIGINS = [
  "https://evidai.github.io",
  "http://localhost:8137",
  "http://localhost:3000",
  "http://127.0.0.1:8137",
];

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "access-control-allow-origin": allow,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
  };
}

export default async function handler(req, res) {
  const headers = corsHeaders(req.headers.origin ?? "");
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const body = req.body;
  if (!body || body.jsonrpc !== "2.0" || typeof body.method !== "string") {
    return res.status(400).json({ error: "not a JSON-RPC 2.0 request" });
  }
  // Casper RPC methods only (purpose-built relay, not an open proxy)
  if (!/^(info_|chain_|state_|account_|query_|speculative_)/.test(body.method)) {
    return res.status(403).json({ error: `method not allowed: ${body.method}` });
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });
    const json = await upstream.json();
    return res.status(upstream.status).json(json);
  } catch (e) {
    return res.status(502).json({ error: `upstream failed: ${e.message}` });
  }
}
