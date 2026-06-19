#!/usr/bin/env node
/**
 * OutcomePay end-to-end orchestrator — the demo's heart.
 *
 * For each job, an autonomous agent:
 *   1. LOCKs CSPR in escrow on Casper (on-chain budget cap enforced)
 *   2. has the work VERIFIED by a real machine check (gctask: dependency CVEs
 *      cleared AND tests green — a binary, non-subjective outcome)
 *   3. SETTLEs on-chain if verified (pay provider), or REFUNDs if not
 *      (green-or-no-fee) — every step a real Casper transaction.
 *
 *   node agent/orchestrator.mjs [--base <jobIdBase>]
 *
 * Reuses the live deployed contract via the odra-cli `contract` interface, so
 * no key material is handled here — the CLI signs with the livenet .env key.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTRACT_DIR = resolve(HERE, "..", "contract");
const CLI = join(CONTRACT_DIR, "target", "debug", "outcomepay_cli");
// Demo: the agent is also the provider (self-settle). Real deployments pass the
// actual provider's account hash.
const PROVIDER = "account-hash-a86533c10b4614b24768d4131e73c7032e566933e33e57a6e2a528f6374eb3d1";

const baseIdx = process.argv.indexOf("--base");
const BASE = baseIdx > -1 ? Number(process.argv[baseIdx + 1]) : 11;

const JOBS = [
  { id: BASE,     name: "Clear CVEs in service-A",  repo: join(HERE, "verifier", "job-pass"), amount: "0.1" },
  { id: BASE + 1, name: "Clear CVEs in service-B",  repo: join(HERE, "verifier", "job-fail"), amount: "0.1" },
];

const EXPLORER = "https://testnet.cspr.live/transaction/";

function cli(args) {
  const out = execFileSync(CLI, args, { cwd: CONTRACT_DIR, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return out;
}
function txHash(out) {
  const m = out.match(/Transaction "([0-9a-fA-F]+)"/);
  return m ? m[1] : null;
}

/** Run the real machine verifier (gctask) — returns true iff outcome is PASS. */
function verify(repo) {
  const report = join(repo, "gctask-report.json");
  if (existsSync(report)) rmSync(report);
  // Repeatability: if a pristine vulnerable seed lockfile exists, restore it so
  // every run starts from the genuinely-vulnerable baseline (and resolves it).
  const seed = join(repo, "package-lock.seed.json");
  if (existsSync(seed)) execFileSync("cp", [seed, join(repo, "package-lock.json")]);
  try {
    execFileSync("node", [join(HERE, "verifier", "gctask-auto.mjs"), repo, "--apply"], {
      encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
  } catch { /* non-zero exit = not chargeable; verdict read from report below */ }
  if (!existsSync(report)) return { pass: false, detail: "verifier produced no report" };
  const j = JSON.parse(readFileSync(report, "utf8"));
  return { pass: j.verdict === "PASS", detail: `${j.verdict} (resolved ${j.highCriticalResolved ?? 0} high/critical)` };
}

const log = (s) => console.log(s);
log(`\n=== OutcomePay — autonomous outcome-settled agent payments on Casper ===\n`);

for (const job of JOBS) {
  log(`▶ Job ${job.id}: "${job.name}"  (escrow ${job.amount} CSPR)`);

  // 1. lock escrow on-chain (cap enforced by the contract)
  const lockOut = cli(["contract", "OutcomePay", "lock",
    "--job_id", String(job.id), "--provider", PROVIDER,
    "--attached_value", job.amount, "--gas", "30000000000"]);
  log(`  1. LOCK  → escrowed on-chain   tx ${EXPLORER}${txHash(lockOut)}`);

  // 2. verify the real outcome (machine-checkable)
  const v = verify(job.repo);
  log(`  2. VERIFY → ${v.detail}`);

  // 3. settle (verified) or refund (failed) — on-chain
  if (v.pass) {
    const out = cli(["contract", "OutcomePay", "settle", "--job_id", String(job.id), "--gas", "10000000000"]);
    log(`  3. SETTLE → paid provider (outcome verified)   tx ${EXPLORER}${txHash(out)}`);
  } else {
    const out = cli(["contract", "OutcomePay", "refund", "--job_id", String(job.id), "--gas", "10000000000"]);
    log(`  3. REFUND → returned to payer (green-or-no-fee)  tx ${EXPLORER}${txHash(out)}`);
  }
  log("");
}

log("Done. The chain enforced the cap, escrowed the funds, and released them");
log("ONLY for the verifiably-completed job — refunding the rest automatically.");
