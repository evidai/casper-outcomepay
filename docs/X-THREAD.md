# X thread (post yourself — numbered, like the threads that travel)

Tone: build-in-public, concrete, proof-first. Tag #Casper #CSPR. Attach a short
screen-grab of the agent demo or the UI to tweet 1.

---

**1/**
Built OutcomePay for the Casper Agentic Buildathon 🟢

The problem: agents that pay on their own (a) overspend, and (b) pay for work that never actually happened.

So I put the budget cap AND the settlement condition *on-chain*. 🧵

**2/**
How it works:

• agent LOCKs CSPR in escrow on Casper — the contract refuses if it exceeds the agent's on-chain cap. Overspend is physically impossible.
• the work is VERIFIED by a machine check (real, not vibes)
• PASS → settle (pay provider). FAIL → refund (green-or-no-fee).

The chain decides. Not the agent.

**3/**
It's live on testnet, not a slide. Full lifecycle, real txns:

set_cap → lock → settle → lock → refund ✅

And an end-to-end run where an agent commissions a real CVE-fix job:
• service-A: CVEs cleared → SETTLE
• service-B: unfixable → REFUND

(tx links in the repo 👇)

**4/**
The agentic part is real: via MCP, Claude itself locks the escrow, reads the verification, and *decides* to settle or refund — moving real funds under an on-chain cap it can't break.

AI Agent Skills + MCP + x402, on Casper. The buildathon's exact theme.

**5/**
Why it's different from the other x402 entries:
everyone does "agents can pay" / "cap them" / "receipts" — separately.

Nobody conditions *release* on a *verified outcome*. Escrow + verify + settle/refund is the missing primitive. That's OutcomePay.

**6/**
Code, contract hash, and every on-chain tx:
https://github.com/evidai/casper-outcomepay
Live: https://evidai.github.io/casper-outcomepay/

The safety layer every paying agent needs: can't overspend, won't pay for nothing.

Feedback welcome 🙏 (and if you're judging on CSPR.fans, a vote helps a ton 🫶)

---

## Notes
- Post tweet 1 with media (the UI screenshot or a 10s agent-demo clip) — media ~doubles reach.
- Consider @-replying / quote-tweeting into the Casper community and tagging the JPYC/agent crowd you already know (e.g. mameta) — warm network beats cold broadcast.
- Repurpose tweet 1+6 as a standalone post too.
