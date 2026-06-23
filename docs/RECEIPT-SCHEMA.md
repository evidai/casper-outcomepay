# Agent Task Receipt — a portable "what it has done" primitive

A chain-agnostic receipt that proves an agent didn't just *pay*, but paid for
**verified** work. Designed to feed the reputation / SATP "task history" layer
that sits above an ERC-8004 identity anchor.

This is not hypothetical — it's the normalized form of what OutcomePay already
emits on Casper testnet today.

## Where it comes from (already on-chain)

The OutcomePay escrow contract emits three events:

```
Locked   { job_id, payer, provider, amount }
Settled  { job_id, provider, amount }   // outcome verified → provider paid
Refunded { job_id, payer, amount }      // outcome failed   → payer repaid
```

A receipt is the terminal state of a job (Settled or Refunded), enriched with
the verifier identity and outcome so it carries *proof of verified work*, not
just *proof of payment*.

## The schema (`agent-task-receipt/v0`)

```json
{
  "schema": "agent-task-receipt/v0",
  "chain": "casper-test",
  "contract": "da6a192c115d4696363e04e87b6ae4ee08c3269e4571fe7cf998befe09eccff1",
  "jobId": "47",
  "payer": "account-hash-a86533c1…",        // the agent that committed funds
  "provider": "account-hash-97112e26…",     // who performed / got paid
  "amount": "100000000",                     // smallest unit (motes)
  "currency": "CSPR",
  "verifier": {
    "id": "gctask/cve-fix@1",                // pluggable; identifies the check
    "outcomeHash": "sha256:…"                // hash of the machine verdict
  },
  "verdict": "settled",                      // "settled" | "refunded"
  "tx": "https://testnet.cspr.live/transaction/12ce8424…",
  "timestamp": "2026-06-19T..."
}
```

Chain-agnostic by construction: only `chain` / `contract` / `tx` / address
encodings change across Casper, EVM, or Solana. The semantic core — *who paid
whom, for what verified outcome, settled or refunded* — stays identical.

## How it fits the layered identity design

```
Solana wallet (transaction signer)
    ↕ key delegation
ERC-8004 anchor  — "where the agent is registered" (DID)
    ↕ attestation
Agent Task Receipts  — "what it has done": portable, verifiable proof of
                       verified work + settlement, off-chain / IPFS-able
```

The receipts are the SATP "task history" layer. Because the **verifier is
pluggable** (the demo uses a deterministic CVE-fix check, but it could be any
machine-checkable outcome), the same receipt format describes *any* verified
agent task across chains — making it a natural cross-chain reputation input that
doesn't bloat the on-chain registry.

## Why "verified" matters here

A plain payment receipt proves an agent spent money. An **outcome-conditioned**
receipt proves the agent spent money *on work that actually passed a check* (or
got refunded if it didn't). For reputation, that's the difference between "this
agent transacts" and "this agent delivers" — which is what a profile layer
should actually score.

Reference implementation (deployed + on-chain txns):
https://github.com/evidai/casper-outcomepay
