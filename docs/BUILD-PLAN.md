# OutcomePay — 11-day build plan (deadline 2026-07-01 09:00)

## Submission requirements (from DoraHacks)
- GitHub/GitLab/Bitbucket link ✅ (we control)
- Demo video ⬅ **you record** (script provided)
- Casper Network Message
- **Must have: a working smart contract deployed on Casper Testnet** (judging criterion)

## Who does what

| Step | Owner | Notes |
|---|---|---|
| Concept, README, pitch | ✅ me | done |
| Escrow smart contract (Odra/Rust) | me | building |
| Compile contract → wasm | me | toolchain installing |
| **Casper Testnet account + faucet funding** | **you** | create a key/wallet, get test CSPR from the faucet (needs your browser/wallet — I can't) |
| Deploy contract to testnet | me (with your funded key) | produces the public deploy hash |
| Agent + gateway + verifier wiring | me | reuses LemonCake x402 + gctask verifier |
| End-to-end demo (lock→work→verify→settle/refund) | me | runnable script |
| **Record demo video** | **you** | I give the exact script/shot list |
| **Register as Hacker on DoraHacks** | **you** | your DoraHacks account |
| **Submit BUIDL** | **you** | paste GitHub + video + Casper message |

## Timeline (today = day 0, ~11 days)

- **Day 0–2**: contract written + compiling locally; agent/gateway/verifier scaffold.
- **Day 2–3**: you create Casper testnet key + faucet fund; I deploy → deploy hash in README.
- **Day 3–6**: full end-to-end demo working against the deployed contract.
- **Day 6–8**: polish, README final, launch-plan section, socials.
- **Day 8–9**: you record the demo video (my script).
- **Day 9–10**: you register + submit on DoraHacks.
- **Day 10–11**: buffer.

## The two things only you can do (start these early)
1. **Casper Testnet wallet + faucet** — make a key, get test CSPR. (We need this before I can deploy.)
2. **DoraHacks "Register as Hacker"** — so we can submit under your account.

Everything else I drive.

## Demo's real-world task (the verifiable outcome)
We reuse the dependency-CVE fix as the machine-checkable job: the agent commissions
"clear the high/critical CVEs", the verifier returns `high+critical == 0 AND tests green`
(binary, non-subjective), and the contract settles or refunds on that result. This makes
the "outcome" concrete and ties to the live CVE/gctask work.
