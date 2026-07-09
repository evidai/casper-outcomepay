# DoraHacks BUIDL submission — copy/paste packet

Submit at: dorahacks.io/hackathon/casper-agentic-buildathon → "Submit BUIDL"
(Register as Hacker first if you haven't.)

---

## Name
OutcomePay

## Tagline (one line)
Autonomous agents pay only for verified work — on-chain escrow that settles on a verified outcome or refunds, under a budget cap, on Casper.

## Tags
Agentic AI, DeFi, RWA, x402, MCP, Casper

## Links
- GitHub: https://github.com/evidai/casper-outcomepay
- Live demo: https://evidai.github.io/casper-outcomepay/
- Demo video: <PASTE YOUR VIDEO URL>

## Demo Video (required)
<PASTE YOUR VIDEO URL — upload the recording to YouTube/Loom and paste here>

## Casper Network Message (custom field)
OutcomePay: outcome-settled escrow for autonomous agents on Casper. An agent locks CSPR, a machine verifies the work, and the chain settles on success or refunds on failure — under an on-chain budget cap it cannot exceed. Deployed on Casper Testnet; full lock/settle/refund lifecycle exercised on-chain, including a real AI agent driving it via MCP. Contract package: da6a192c115d4696363e04e87b6ae4ee08c3269e4571fe7cf998befe09eccff1

## Description (long — paste as-is)

**The problem.** Agents that pay autonomously fail two ways: they overspend, and they pay for work that never happened. "Set a budget" in code isn't enforceable once an agent holds keys, and there's no "pay only if it actually worked."

**OutcomePay** puts both the budget cap and the payout condition **on-chain**, in a Casper smart contract:

1. **Lock** — the agent escrows CSPR for a job. The contract reverts anything over its budget cap, so overspending is physically impossible (proven on-chain: CapExceeded revert).
2. **Verify** — a machine check decides the outcome. Our demo verifier is a real dependency-CVE fix: `high+critical == 0 AND tests green` — binary, not subjective.
3. **Settle / Refund** — verified → escrow released to the provider; failed → refunded to the payer (green-or-no-fee). The chain decides, not the agent.

**Agent-native (MCP).** A real AI agent (Claude) commissions the work through an MCP server, reads the verification, and decides to settle or refund itself — the buildathon's exact theme: AI Agent Skills + MCP + x402, on Casper.

**Why it's more than an x402 gateway.** Existing entries do "agents can pay" / "cap them" / "receipts" separately. OutcomePay is the missing primitive: **release conditioned on a verified outcome** — escrow + verify + settle/refund.

**Proven live on Casper Testnet (all verifiable on cspr.live):**
- Contract deployed + full lock/settle/refund lifecycle on-chain.
- On-chain budget cap actually blocks overspend (CapExceeded revert).
- Settle pays a distinct provider account (real value transfer, balance 0 → 0.1 CSPR).
- A real AI agent via MCP settled a verified job and refunded a failed one — on-chain.

**Long-term.** The safety layer every paying agent needs. Backed by LemonCake, a live x402 agent-payment rail; OutcomePay is its on-chain outcome-settlement layer.

## Test it yourself — step-by-step (no marketing, ~5 minutes)

**A. Verify the on-chain proof (30 seconds, nothing to install):**
1. Open the contract package: https://testnet.cspr.live/contract-package/da6a192c115d4696363e04e87b6ae4ee08c3269e4571fe7cf998befe09eccff1
2. Open the four transactions listed below — they show the full lifecycle: install, settle (verified job), refund (failed job), and a CapExceeded revert (overspend physically blocked).

**B. Run the machine verifier locally (2 minutes, Node 20+):**
```bash
git clone https://github.com/evidai/casper-outcomepay && cd casper-outcomepay
node agent/verifier/gctask-auto.mjs agent/verifier/job-pass --apply   # → PASS  (high+critical CVEs cleared, tests green → chargeable)
node agent/verifier/gctask-auto.mjs agent/verifier/job-fail --apply   # → PARTIAL (unresolvable → NOT chargeable → refund path)
```
Each run writes `gctask-report.json` — the binary verdict the contract settles on.
(The job-fail fixture ships its manifests as `*.fixture.json`; the orchestrator materializes them at runtime, so repo dependency scanners stay clean.)

**C. Full agent loop on Casper Testnet (optional, needs a funded testnet key):**
```bash
node agent/orchestrator.mjs        # lock → verify → settle/refund, end-to-end on-chain
cd mcp && npm i && node server.mjs # same loop, driven by an AI agent via MCP
```
See docs/AGENT-DEMO.md for the MCP walk-through.

## Key on-chain transactions (for judges)
- Contract install: https://testnet.cspr.live/transaction/ca88a1b188e636fcd3aa0d100fcefc91f060fb500b54c44ae6d47784ae4aa250
- AI agent (MCP) settle (Job 47, verified): https://testnet.cspr.live/transaction/12ce84249546aaa1687ae60bbca3ab702db1972ae21096b20878a7b036b578a9
- AI agent (MCP) refund (Job 48, failed): https://testnet.cspr.live/transaction/be49522f04b34571c3f2607df27cad2b2f0e5504218192d1efb6992a95fbd351
- Budget-cap revert (overspend blocked): https://testnet.cspr.live/transaction/afd876ae42c74e7ae0810b8fd3d127d8c844ce165b48cdd65fcc92a71b576d05
