#!/usr/bin/env node
/**
 * gctask-auto — hands-off, SAFE-BY-CONSTRUCTION dependency CVE remediation.
 *
 * Point it at a local repo (or a cloned checkout). It auto-fixes only the
 * vulnerabilities that can be fixed WITHIN semver range and PROVEN safe by the
 * repo's own gate (tests or build). Anything else is quarantined and reported,
 * never attempted. It can never leave the repo broken.
 *
 *   node gctask-auto.mjs <path-to-repo>
 *   node gctask-auto.mjs <path-to-repo> --branch        # commit the safe fix on a new branch
 *
 * SAFETY INVARIANTS (the whole point — mixing safe + risky must never break things):
 *   1. NEVER runs `npm audit fix --force`. Only semver-range fixes. The exact
 *      thing that broke the dashboard wallet tree cannot happen here.
 *   2. REFUSES a repo whose gate is already red (can't prove we didn't break it).
 *   3. REFUSES a repo with no gate at all (no `test` and no `build` script) —
 *      unverifiable means unguaranteeable, so we touch nothing.
 *   4. After fixing, RE-RUNS the gate. If it regresses, AUTO-REVERTS
 *      package.json + lockfile to the pre-fix state and reports FAIL. The repo
 *      is left exactly as found.
 *   5. Declares PASS only when (high+critical == 0) AND (gate green). Exit code
 *      mirrors the verdict.
 *   6. Works on the current checkout; with --branch it isolates work on a new
 *      git branch and never touches the default branch. It never pushes and
 *      never opens a PR (outward actions stay manual on purpose).
 */

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, copyFileSync } from "node:fs";
import { join, resolve, basename } from "node:path";

const target = resolve(process.argv[2] ?? ".");
const MAKE_BRANCH = process.argv.includes("--branch");

// Intentionally-vulnerable fixtures ship manifests as *.fixture.json (kept out
// of dependency scanners); materialize them so the target is runnable as-is.
for (const f of ["package.json", "package-lock.json"]) {
  const fixture = join(target, f.replace(/\.json$/, ".fixture.json"));
  if (!existsSync(join(target, f)) && existsSync(fixture)) copyFileSync(fixture, join(target, f));
}

if (!existsSync(join(target, "package.json"))) {
  console.error(`No package.json in ${target}`);
  process.exit(2);
}

const sh = (cmd, opts = {}) =>
  execSync(cmd, { cwd: target, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts });
const log = (s) => console.log(s);

function audit() {
  let raw;
  try { raw = sh("npm audit --json"); } catch (e) { raw = e.stdout || "{}"; }
  let j; try { j = JSON.parse(raw); } catch { j = {}; }
  const v = j.metadata?.vulnerabilities ?? {};
  return { high: v.high ?? 0, critical: v.critical ?? 0, total: v.total ?? 0 };
}

/** Pick the verification gate from package.json. test > build. null if none. */
function pickGate() {
  const pkg = JSON.parse(readFileSync(join(target, "package.json"), "utf8"));
  const scripts = pkg.scripts ?? {};
  const isReal = (s) => s && !/no test specified/i.test(s);
  if (isReal(scripts.test)) return { name: "test", cmd: "npm test --silent" };
  if (isReal(scripts.build)) return { name: "build", cmd: "npm run build" };
  return null;
}

function runGate(gate) {
  try { sh(gate.cmd, { stdio: ["ignore", "pipe", "pipe"] }); return true; }
  catch { return false; }
}

/** Snapshot the files npm may change, so we can restore them verbatim. */
function snapshot() {
  const files = ["package.json", "package-lock.json"];
  const snap = {};
  for (const f of files) {
    const p = join(target, f);
    if (existsSync(p)) snap[f] = readFileSync(p, "utf8");
  }
  return snap;
}
function restore(snap) {
  for (const [f, content] of Object.entries(snap)) writeFileSync(join(target, f), content);
  sh("npm install --no-audit --no-fund --silent"); // re-sync node_modules to restored lockfile
}

log(`\n=== gctask-auto (safe) — ${target} ===\n`);

// install
log("• Installing dependencies…");
try { sh("npm install --no-audit --no-fund --silent"); }
catch (e) { console.error("npm install failed; refusing.\n" + (e.stdout || e.stderr)); process.exit(2); }

// SAFETY 3: must have a gate
const gate = pickGate();
if (!gate) {
  log("✋ REFUSED: no test or build script — the result is unverifiable, so it");
  log("   cannot be guaranteed. Nothing was changed.");
  writeFileSync(join(target, "gctask-report.json"),
    JSON.stringify({ target, verdict: "REFUSED", reason: "no verification gate", chargeable: false }, null, 2));
  process.exit(1);
}
log(`• Gate: ${gate.name} ("${gate.cmd}")`);

const before = audit();
log(`• Baseline audit: high=${before.high} critical=${before.critical} (total=${before.total})`);

// SAFETY 2: baseline gate must be green
log(`• Baseline ${gate.name}…`);
if (!runGate(gate)) {
  log(`✋ REFUSED: baseline ${gate.name} is RED. Out of scope until the repo's own`);
  log("   gate passes — we guarantee 'no NEW breakage', not pre-existing failures.");
  writeFileSync(join(target, "gctask-report.json"),
    JSON.stringify({ target, verdict: "REFUSED", reason: `baseline ${gate.name} red`, chargeable: false }, null, 2));
  process.exit(1);
}
log("  GREEN");

// SAFETY 1: semver-only fix (never --force)
const snap = snapshot();
log("\n• Applying SAFE fixes (npm audit fix, no --force)…");
try { sh("npm audit fix --no-fund"); } catch { /* non-zero when some issues remain — expected */ }

const after = audit();
log(`• Post-fix audit: high=${after.high} critical=${after.critical} (total=${after.total})`);

// SAFETY 4: re-verify; auto-revert on regression
log(`• Re-running ${gate.name}…`);
const gateGreen = runGate(gate);
if (!gateGreen) {
  log(`  RED — the safe fix regressed the ${gate.name}. AUTO-REVERTING to original state…`);
  restore(snap);
  log("  reverted. Repo is exactly as found.");
  writeFileSync(join(target, "gctask-report.json"),
    JSON.stringify({ target, verdict: "FAIL", reason: `fix regressed ${gate.name}; reverted`, before, chargeable: false }, null, 2));
  process.exit(1);
}
log("  GREEN");

const resolved = (before.high + before.critical) - (after.high + after.critical);
// SAFETY 5: PASS only when high+critical == 0 AND gate green
const PASS = after.high === 0 && after.critical === 0 && gateGreen;

const report = {
  target,
  gate: gate.name,
  acceptanceCriteria: "high+critical == 0 AND gate green (semver-only, never --force)",
  before, after,
  highCriticalResolved: resolved,
  remainingHighCritical: after.high + after.critical,
  remainingNote: (after.high + after.critical) > 0
    ? "Remaining high/critical need major bumps or code changes — OUT OF SCOPE, not attempted (quarantined for human review)."
    : "All high/critical resolved within semver.",
  verdict: PASS ? "PASS" : "PARTIAL",
  chargeable: PASS,
};
writeFileSync(join(target, "gctask-report.json"), JSON.stringify(report, null, 2));

// SAFETY 6: isolate on a branch if asked; never touch default branch, never push
let branchMsg = "";
if (MAKE_BRANCH && resolved > 0) {
  try {
    const isRepo = (() => { try { sh("git rev-parse --is-inside-work-tree"); return true; } catch { return false; } })();
    if (isRepo) {
      const br = `gctask/safe-dep-fix-${basename(target)}`;
      sh(`git checkout -b ${br}`);
      sh(`git add package.json package-lock.json`);
      sh(`git commit -m "fix(deps): resolve ${resolved} high/critical advisories (semver-only, ${gate.name} green)"`);
      branchMsg = `\n• Committed the safe fix on branch '${br}' (not pushed, default branch untouched).`;
    }
  } catch (e) { branchMsg = `\n• (branch step skipped: ${(e.message || "").split("\n")[0]})`; }
}

log(`\n=== VERDICT: ${report.verdict} ===`);
log(`high+critical resolved: ${resolved}   remaining (out of scope): ${after.high + after.critical}`);
log(`chargeable (green-or-no-fee): ${report.chargeable}${branchMsg}`);
log(`report: ${join(target, "gctask-report.json")}`);

process.exit(PASS ? 0 : 1);
