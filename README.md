# OutcomePay — outcome-settled autonomous agent payments on Casper

**An AI agent pays for real-world work on its own — but the money is escrowed in a
Casper smart contract and released only when the outcome is machine-verified, under
a hard on-chain budget cap the agent physically cannot exceed. Every settlement
emits a verifiable on-chain receipt.**

**Live demo:** https://evidai.github.io/casper-outcomepay/  ·  **🔥 Drive it with your Casper Wallet (Testnet):** https://evidai.github.io/casper-outcomepay/ui/live.html  ·  **Repo:** https://github.com/evidai/casper-outcomepay

> Casper Agentic Buildathon 2026 — Qualification Round. Theme: Agentic AI × DeFi × RWA.

## The problem

Agents that pay autonomously are dangerous in two ways:
1. **Overspend** — a runaway loop drains the wallet. "Set a budget" in code isn't enforceable once the agent holds keys.
2. **Pay for nothing** — the agent pays, the work fails, the money is gone. There's no "pay only if it actually worked."

Existing x402 gateways move money on request. They don't *escrow*, don't enforce a
*cap on-chain*, and don't condition release on a *verified outcome*.

## The solution

OutcomePay puts the **budget cap and the settlement condition on-chain**, in a Casper
contract, so they're enforced by consensus — not by trusting the agent's code.

```
Agent needs a real-world task done (e.g. "fix the high/critical CVEs in this repo")
        │
        ▼
1. LOCK   agent calls escrow.lock(job_id, amount)         ── on-chain budget cap checked here:
          the contract refuses if total locked > cap        the agent CANNOT exceed its cap
        │
        ▼
2. WORK   the service performs the task (off-chain)
        │
        ▼
3. VERIFY a machine check produces a binary outcome         ── the oracle: pass/fail is a fact,
          (CVE: high+critical == 0 AND tests green)            not a human opinion
        │
        ├─ PASS → escrow.settle(job_id)  → funds released to provider + SettlementEvent receipt
        └─ FAIL → escrow.refund(job_id)  → funds returned to payer (green-or-no-fee), on-chain
```

The agent gets autonomy; the chain guarantees it can't overspend and won't pay for
unverified work. The receipt is permanent and auditable.

## Why this is more than an x402 gateway

| | x402 gateway (existing) | OutcomePay |
|---|---|---|
| Moves money on request | ✅ | ✅ |
| Hard budget cap **enforced on-chain** | ❌ | ✅ |
| Funds **escrowed**, not sent immediately | ❌ | ✅ |
| Release **conditioned on verified outcome** | ❌ | ✅ (settle vs refund) |
| Verifiable on-chain **receipt** per settlement | partial | ✅ SettlementEvent |
| Pay-only-on-success (green-or-no-fee) | ❌ | ✅ |

## Architecture

- **`contract/`** — Casper smart contract (Odra/Rust), deployed to **Casper Testnet**:
  per-agent budget cap, per-job escrow, `lock` / `settle` / `refund`, `SettlementEvent`.
- **`agent/`** — an autonomous agent that needs a task done, locks escrow, consumes the
  result, and triggers settle/refund based on the verifier.
- **`gateway/`** — the service side: receives the agent's request, runs the work, and
  exposes a machine-checkable outcome (reuses the x402 / pay-token pattern from LemonCake).
- **The verifier** — a deterministic, machine-checkable outcome (the demo uses a dependency
  CVE fix: `high+critical == 0 AND tests green` — a binary, non-subjective oracle).

## Maps to the judging criteria

| Criterion | How OutcomePay meets it |
|---|---|
| Technical Execution | On-chain escrow state machine + agent + verifier, end to end |
| Innovation & Originality | On-chain cap + outcome-conditioned settlement + receipt — not a plain gateway |
| Use of AI / Agentic Systems | Agent autonomously commissions, pays, and settles real work |
| Real-World Applicability (DeFi & RWA) | DeFi escrow primitive; RWA = paying for real services/labor |
| User Experience & Design | One-command demo: watch lock → work → verify → settle/refund live |
| Working Smart Contracts (Casper Testnet) | Deployed escrow contract with public deploy hash |
| Long-Term Launch Plans | Productionized as LemonCake's settlement layer; socials at @Evid_ai |
| Long-Term Impact | A safety primitive every paying agent needs: can't overspend, won't pay for nothing |

## Status

- [x] Escrow contract (lock/settle/refund/cap + Locked/Settled/Refunded events) — 3/3 unit tests pass
- [x] **Deployed to Casper Testnet** ✅
  - Contract package: `da6a192c115d4696363e04e87b6ae4ee08c3269e4571fe7cf998befe09eccff1`
  - Install tx: [`ca88a1b1…aa250`](https://testnet.cspr.live/transaction/ca88a1b188e636fcd3aa0d100fcefc91f060fb500b54c44ae6d47784ae4aa250)
- [x] **Exercised on-chain**: set_cap → lock → settle → lock → refund — all txns executed live (see `docs/DEPLOYMENT.md`)
- [x] **MCP server** wrapping lock/settle/refund/status + commission_verified_fix (`mcp/server.mjs`) — agent-native
- [x] **End-to-end orchestrator** (`agent/orchestrator.mjs`): agent locks escrow → real gctask verifier decides → settle (pass) / refund (fail), all on-chain
- [ ] Demo video (script ready: `docs/DEMO-SCRIPT.md`)
- [ ] DoraHacks BUIDL submission (founder)

## Run it

```bash
# end-to-end (scripted): lock → verify (real CVE machine-check) → settle/refund, all on Casper testnet
node agent/orchestrator.mjs --base 21      # use a fresh, unused job-id base each run

# agent-native via MCP (after: cd mcp && npm i)
node mcp/server.mjs                         # exposes outcomepay_* tools to any MCP client
```

**Real AI agent (the agentic centerpiece):** wire the MCP server into Claude
Desktop and Claude itself commissions the work, reads the verification, and
*decides* to settle or refund — see `docs/AGENT-DEMO.md`. The verifier resolves
real high/critical CVEs (job-pass) → settle, and refuses unfixable ones
(job-fail) → refund, so "pay only for verified work" is true on camera.

## Built on

LemonCake (live x402 agent-payment rail, https://www.lemoncake.xyz) brings the
production payment experience; OutcomePay brings the on-chain safety + settlement
guarantee to Casper. Team: @Evid_ai.
