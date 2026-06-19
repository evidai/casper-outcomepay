#!/usr/bin/env node
/**
 * OutcomePay MCP server — makes the Casper escrow agent-native.
 *
 * Any MCP client (Claude Desktop, etc.) can let an autonomous agent escrow
 * funds on Casper, settle on a verified outcome, or refund on failure — the
 * explicit theme of the buildathon (AI Agent Skills + MCP + x402) realized as
 * a working tool surface.
 *
 * Tools:
 *   outcomepay_lock(job_id, amount_cspr, provider?)   — escrow on Casper (cap-enforced)
 *   outcomepay_settle(job_id)                          — release to provider (outcome verified)
 *   outcomepay_refund(job_id)                          — return to payer (green-or-no-fee)
 *   outcomepay_status(job_id)                          — 0 none / 1 locked / 2 settled / 3 refunded
 *   outcomepay_commission_verified_fix(repo, job_id, amount_cspr) — lock → gctask verify → settle/refund
 *
 * Signing is done by the odra-cli using the livenet key in contract/.env; no
 * key material passes through this server.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTRACT_DIR = resolve(HERE, "..", "contract");
const CLI = join(CONTRACT_DIR, "target", "debug", "outcomepay_cli");
const VERIFIER = join(HERE, "..", "agent", "verifier", "gctask-auto.mjs");
const DEFAULT_PROVIDER = "account-hash-a86533c10b4614b24768d4131e73c7032e566933e33e57a6e2a528f6374eb3d1";
const EXPLORER = "https://testnet.cspr.live/transaction/";

function cli(args) {
  try {
    const out = execFileSync(CLI, args, { cwd: CONTRACT_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    const tx = (out.match(/Transaction "([0-9a-fA-F]+)"/) || [])[1];
    return { ok: true, tx, url: tx ? EXPLORER + tx : null, raw: out.slice(-600) };
  } catch (e) {
    return { ok: false, raw: ((e.stdout || "") + (e.stderr || "")).slice(-600) };
  }
}
function verify(repo) {
  const report = join(repo, "gctask-report.json");
  if (existsSync(report)) rmSync(report);
  try { execFileSync("node", [VERIFIER, repo, "--apply"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); } catch {}
  if (!existsSync(report)) return { pass: false, detail: "no report" };
  const j = JSON.parse(readFileSync(report, "utf8"));
  return { pass: j.verdict === "PASS", detail: `${j.verdict} (resolved ${j.highCriticalResolved ?? 0})` };
}
const text = (s) => ({ content: [{ type: "text", text: s }] });

const TOOLS = [
  { name: "outcomepay_lock", description: "Lock CSPR in escrow on Casper for a job (on-chain budget cap enforced).",
    inputSchema: { type: "object", required: ["job_id", "amount_cspr"], properties: {
      job_id: { type: "integer" }, amount_cspr: { type: "string", description: "e.g. \"0.1\"" },
      provider: { type: "string", description: "account-hash-… paid on settle (defaults to demo provider)" } } } },
  { name: "outcomepay_settle", description: "Release escrow to the provider (call when the outcome is verified).",
    inputSchema: { type: "object", required: ["job_id"], properties: { job_id: { type: "integer" } } } },
  { name: "outcomepay_refund", description: "Return escrow to the payer (green-or-no-fee, when the outcome failed).",
    inputSchema: { type: "object", required: ["job_id"], properties: { job_id: { type: "integer" } } } },
  { name: "outcomepay_status", description: "Read job status: 0 none, 1 locked, 2 settled, 3 refunded.",
    inputSchema: { type: "object", required: ["job_id"], properties: { job_id: { type: "integer" } } } },
  { name: "outcomepay_commission_verified_fix",
    description: "End-to-end: lock escrow, run the machine verifier (gctask CVE check) on a repo, then settle if it passes or refund if it fails.",
    inputSchema: { type: "object", required: ["repo", "job_id", "amount_cspr"], properties: {
      repo: { type: "string" }, job_id: { type: "integer" }, amount_cspr: { type: "string" },
      provider: { type: "string" } } } },
];

const server = new Server({ name: "outcomepay", version: "0.1.0" }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const a = req.params.arguments ?? {};
  const provider = a.provider || DEFAULT_PROVIDER;
  switch (req.params.name) {
    case "outcomepay_lock": {
      const r = cli(["contract", "OutcomePay", "lock", "--job_id", String(a.job_id), "--provider", provider, "--attached_value", String(a.amount_cspr), "--gas", "30000000000"]);
      return text(r.ok ? `Locked ${a.amount_cspr} CSPR for job ${a.job_id}.\n${r.url}` : `Lock failed:\n${r.raw}`);
    }
    case "outcomepay_settle": {
      const r = cli(["contract", "OutcomePay", "settle", "--job_id", String(a.job_id), "--gas", "10000000000"]);
      return text(r.ok ? `Settled job ${a.job_id} → provider paid.\n${r.url}` : `Settle failed:\n${r.raw}`);
    }
    case "outcomepay_refund": {
      const r = cli(["contract", "OutcomePay", "refund", "--job_id", String(a.job_id), "--gas", "10000000000"]);
      return text(r.ok ? `Refunded job ${a.job_id} → payer repaid.\n${r.url}` : `Refund failed:\n${r.raw}`);
    }
    case "outcomepay_status": {
      const r = cli(["contract", "OutcomePay", "status_of", "--job_id", String(a.job_id)]);
      return text(r.raw);
    }
    case "outcomepay_commission_verified_fix": {
      const lock = cli(["contract", "OutcomePay", "lock", "--job_id", String(a.job_id), "--provider", provider, "--attached_value", String(a.amount_cspr), "--gas", "30000000000"]);
      if (!lock.ok) return text(`Lock failed:\n${lock.raw}`);
      const v = verify(resolve(a.repo));
      const fin = v.pass
        ? cli(["contract", "OutcomePay", "settle", "--job_id", String(a.job_id), "--gas", "10000000000"])
        : cli(["contract", "OutcomePay", "refund", "--job_id", String(a.job_id), "--gas", "10000000000"]);
      return text([
        `Job ${a.job_id}: locked ${a.amount_cspr} CSPR (${lock.url})`,
        `Verify: ${v.detail}`,
        v.pass ? `Settled → provider paid (${fin.url})` : `Refunded → payer repaid, green-or-no-fee (${fin.url})`,
      ].join("\n"));
    }
    default:
      return text(`Unknown tool: ${req.params.name}`);
  }
});

await server.connect(new StdioServerTransport());
console.error("OutcomePay MCP server running (stdio).");
