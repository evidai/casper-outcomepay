# Record the demo (follow this exactly — ~2.5 min)

Everything is pre-checked: contract deployed, gas funded (~1400 CSPR), cap = 1 CSPR.
You just screen-record three short things and stitch them. No editing skills needed.

## Before you hit record
- Open a terminal at the repo root: `cd /Users/workoutsomehow/adhunt-pro/casper-outcomepay`
- Open a browser tab on the live UI: https://evidai.github.io/casper-outcomepay/
- Make the terminal font big (so it reads on video).

---

## Shot 1 — the live run (terminal) · ~60s · THE hero shot

Start recording, then run **exactly**:

```bash
node agent/orchestrator.mjs --base 41
```

Narrate while it runs (slowly):
> "An autonomous agent commissions two real jobs. For each, it **locks CSPR in
> escrow on Casper**, runs a **machine verifier**, and the **chain settles or
> refunds** based on the result.
> Job A — the CVEs are fixed, verification PASSES, so it **settles**: the provider gets paid.
> Job B — it can't be fixed, verification FAILS, so it **refunds** automatically. Green-or-no-fee.
> Every line here is a real on-chain transaction."

(It prints a lock + settle/refund tx link per job. Leave them on screen a beat.)

## Shot 2 — proof on-chain (browser) · ~30s

- Copy one **settle** tx link from the terminal, open it on testnet.cspr.live.
- Say: "Here it is on-chain — real, public, verifiable. Not a mockup."
- Optional: also open the **reverted** cap tx to show overspend is blocked:
  https://testnet.cspr.live/transaction/afd876ae42c74e7ae0810b8fd3d127d8c844ce165b48cdd65fcc92a71b576d05
  > "And when the agent tries to exceed its budget, the chain rejects it — CapExceeded."

## Shot 3 — agent-native via MCP (Claude Desktop) · ~40s · the "AI" shot
(Wire it first per `docs/AGENT-DEMO.md`.)
- In Claude Desktop, paste the agent prompt from `docs/AGENT-DEMO.md` (use job ids 43/44).
- Record Claude calling `outcomepay_lock` → `outcomepay_verify` → and **deciding**
  to `outcomepay_settle` or `outcomepay_refund` itself.
- Say: "And any agent can do this through MCP — Claude reads the verification and
  decides to pay or refund, moving real funds under an on-chain cap it can't break."

## Shot 4 — close (the UI) · ~15s
- Show https://evidai.github.io/casper-outcomepay/ and click ▶ Run the demo.
- Say: "OutcomePay — agents pay only for verified work. On Casper."

---

## If anything errors mid-record
- "JobExists" → you reused a job id. Just bump `--base` (41 → 51 → 61 …) and rerun.
- Everything else is pre-tested; the orchestrator run above is known-good.

## Caption / description to paste on the submission + X
> OutcomePay: outcome-settled escrow for autonomous agents on Casper. An agent
> locks funds, a machine verifies the work, and the chain settles on success or
> refunds on failure — under an on-chain budget cap it can't exceed. Deployed on
> testnet, full lock/settle/refund lifecycle on-chain. MCP-native + x402.
> Code: github.com/evidai/casper-outcomepay · Live: evidai.github.io/casper-outcomepay
