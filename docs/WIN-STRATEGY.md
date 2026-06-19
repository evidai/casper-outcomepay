# OutcomePay — how we win the Casper Agentic Buildathon

## Prize structure (what's actually being rewarded)
- Total **$150,000**: Cash **$30,000** + **x402 Ecosystem Credits $100,000** + Co-sponsor in-kind $20,000.
- **$100k is x402-weighted** → x402 is where the value is. We are x402-native.
- One unified track (Casper Innovation Track). Two qualification paths:
  1. **Community Path** — votes on the CSPR.fans app → advance to Final Round with no extra judging.
  2. **Builder Merit Path** — a working prototype on Casper Testnet *with a transaction-producing on-chain component* → Final Round jury.
- The buildathon explicitly names the core tech: **AI Agent Skills + MCP + the X402 standard**, for agents that connect wallets, sign tx, manage assets, interact with contracts. We are expert in all three.

## Competitive landscape (46 BUIDLs) — where it's crowded vs the gap

**Crowded (7+):** x402 payment plumbing —
- Casper x402 Fuse (gateway/middleware), AgentPay-x402 (autonomous buy/sell),
  CasperAgent Pay (NL payments), cred402 (agent credit scores),
- VeriFeed (**x402 receipts**) ← our "receipt" idea already exists,
- Aegis (**spending guard / cap**) ← our "budget cap" idea already exists.

**Adjacent:** oracles/attestations — verity, RWA Oracle Agent, ProofOps, InvariantLab.

**The white space nobody is in:** **outcome-conditioned settlement.** No project ties a
*verified outcome* to *payment release*. Everyone does "agents can pay" / "cap them" /
"give receipts" / "post oracle data" — separately. Nobody does **"escrow the money, release
it only when the work is verifiably done, auto-refund when it isn't."** That is OutcomePay.

## Our winning angle (3 differentiators that weaponize the founder's existing assets)

1. **Core primitive = outcome-conditioned escrow** (the gap): `lock` → `settle` (on verified
   pass) / `refund` (on fail), with an on-chain budget cap and a receipt event per transition.
   Contract is built and passing tests (lock/settle/refund + cap-revert verified).
2. **A real verifier, not a toy oracle:** the outcome is the live `gctask` machine check —
   "dependency high+critical == 0 AND tests green" — a binary, deployed, real software-work
   outcome. Most competitors demo a fake oracle; ours settles real RWA work.
3. **MCP-native:** expose OutcomePay as an MCP server so *any* agent (Claude, etc.) can
   commission real work, escrow on Casper, and settle on the verified result. Hits the
   explicitly-named MCP theme; almost no competitor is MCP-native; leverages the 6 MCPs
   already built.

Plus the launch-plan edge: LemonCake is a *live* x402 rail (lemoncake.xyz) — OutcomePay is
its on-chain outcome-settlement layer on Casper. Real project, real socials (@Evid_ai).

## How each judging criterion is won
- **Technical Execution:** deployed escrow contract + agent + MCP + verifier, end to end.
- **Innovation:** the only outcome-conditioned settlement primitive in the field.
- **AI/Agentic:** an agent autonomously commissions, escrows, and settles via MCP.
- **Real-World (DeFi & RWA):** DeFi escrow; RWA = paying for real software labor, verified.
- **UX:** one-command demo: lock → work → verify → settle/refund, live, with on-chain proof.
- **Working Contract on Testnet:** deploy hash + on-chain Locked/Settled/Refunded events.
- **Launch plan / impact:** the safety primitive every paying agent needs; live rail behind it.

## Two-path play
- **Primary: Builder Merit** — our deployed testnet contract with on-chain tx qualifies us.
- **Bonus: CSPR.fans community votes** — mobilize the JP/web3 network (mameta_zk and the JPYC
  crowd) for votes → potential direct-to-Final. Low effort, pure upside.

## Build status
- [x] Concept + pitch + competitive positioning
- [x] Escrow contract (Odra 2.8) — compiles, 3/3 tests pass (cap enforcement verified)
- [ ] Deploy to Casper Testnet (needs founder's funded testnet key)
- [ ] MCP server wrapping lock/settle/refund
- [ ] Agent + gctask verifier wired end-to-end
- [ ] Demo video + DoraHacks submission (founder)
