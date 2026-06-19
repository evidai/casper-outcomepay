# Real AI agent demo — Claude autonomously pays for verified work on Casper

This is the "Use of AI / Agentic Systems" centerpiece: a real LLM agent (Claude,
via MCP) commissions work, escrows on Casper, **reads the verification, and
decides itself** whether to settle or refund — using the OutcomePay tools.

## 1. Wire the MCP server into Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` and add:

```json
{
  "mcpServers": {
    "outcomepay": {
      "command": "node",
      "args": ["/Users/workoutsomehow/adhunt-pro/casper-outcomepay/mcp/server.mjs"]
    }
  }
}
```

Restart Claude Desktop. You should see the `outcomepay_*` tools available.

Prereqs (already done on this machine): `mcp/` has `npm i` run; the contract is
built (`contract/target/debug/outcomepay_cli`); `contract/.env` holds the livenet
key; the contract is deployed on testnet.

## 2. The agent prompt (paste into Claude Desktop, then record)

> You are an autonomous procurement agent with a hard budget. You must get the
> dependency CVEs fixed in two repos, and you pay **only for verified results**.
>
> For each job, do this yourself using the OutcomePay tools:
> 1. `outcomepay_lock` — escrow 0.1 CSPR on Casper (this enforces my on-chain cap).
> 2. `outcomepay_verify` — run the machine check on the repo.
> 3. Based on the verification result, **decide**: if it passed, `outcomepay_settle`
>    (pay the provider); if it failed, `outcomepay_refund` (green-or-no-fee).
> 4. Report the on-chain transaction links and explain your decision.
>
> Job A — repo: `/Users/workoutsomehow/adhunt-pro/casper-outcomepay/agent/verifier/job-pass`, use job_id 41
> Job B — repo: `/Users/workoutsomehow/adhunt-pro/casper-outcomepay/agent/verifier/job-fail`, use job_id 42
>
> Use a fresh job_id pair each run (e.g. 41/42, then 43/44, …) since ids can't be reused.

Claude will call lock → verify → (decide) → settle for Job A (CVEs fixed, PASS)
and refund for Job B (unfixable, FAIL), narrating its reasoning. That is the
agentic loop: the LLM, not a script, decides to release or refund based on a
verified outcome — and the chain enforces the cap and the escrow.

## 3. Recording the video
- Screen-record Claude Desktop running the prompt above.
- Show one resulting settle tx and one refund tx on testnet.cspr.live.
- Optional: also show `node agent/orchestrator.mjs --base 51` (the scripted
  version) for a clean, fast end-to-end shot.

## Why this matters for judging
"Use of AI / Agentic Systems" wants a *meaningful* agent. Here the agent reasons
over a real verification result and autonomously moves real funds on-chain —
under an on-chain budget cap it cannot exceed. That is the agentic safety story
the buildathon is about (AI Agent Skills + MCP + x402 on Casper).
