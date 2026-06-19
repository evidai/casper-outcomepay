# OutcomePay — demo video script (2–3 min)

Record screen + voiceover. Goal: show an autonomous agent paying for **verified**
real work on Casper — money escrowed, released only on a machine-verified outcome,
refunded otherwise, with a hard on-chain cap. Keep it tight.

## Shot list

**0:00–0:20 — The problem (talking head or slide)**
> "Agents that pay on their own have two failure modes: they overspend, and they
> pay for work that didn't actually happen. OutcomePay fixes both — on Casper."

**0:20–0:40 — The contract is live (browser)**
- Show the deployed contract / install tx on testnet.cspr.live (from `docs/DEPLOYMENT.md`).
- Say: "The escrow contract is deployed on Casper testnet. Budget cap, lock,
  settle, refund — all enforced on-chain."

**0:40–1:40 — The end-to-end run (terminal) — the hero shot**
- Run: `node agent/orchestrator.mjs --base <fresh>`
- Narrate as it runs, two jobs:
  - Job A: "The agent locks 0.1 CSPR in escrow… the verifier checks the work —
    CVEs cleared, tests green — PASS… so the contract SETTLES: the provider gets paid."
  - Job B: "Second job locks escrow… the verifier FAILS (can't be fixed safely)…
    so the contract REFUNDS automatically. Green-or-no-fee, enforced on-chain."
- Emphasize: "The agent never decided to release the money — the chain did, based
  on a verified outcome. And it physically couldn't exceed its on-chain cap."

**1:40–2:10 — Agent-native via MCP (terminal or Claude Desktop)**
- Show the MCP server tools (or call `outcomepay_commission_verified_fix` from an
  MCP client). Say: "Any agent can do this through MCP — the buildathon's exact
  theme: AI Agent Skills + MCP + x402, on Casper."

**2:10–2:40 — Proof + close (browser)**
- Open one settle and one refund tx on testnet.cspr.live (from the run output).
- Close: "Outcome-settled agent payments. The safety layer every paying agent
  needs. Built on Casper. Backed by a live x402 rail, LemonCake."

## Links to show (fill from your run)
- Deploy/contract: see `docs/DEPLOYMENT.md`
- A settle tx: __________
- A refund tx: __________

## One-liners to put in the DoraHacks "Casper Network Message" field
> OutcomePay: outcome-settled escrow for autonomous agents on Casper. Lock → verify
> → settle/refund, with an on-chain budget cap and verifiable receipts. Deployed on
> testnet; full lock/settle/refund lifecycle exercised on-chain. MCP-native + x402.
