# OutcomePay — Casper Testnet deployment

- **Network:** casper-test (Casper Testnet)
- **Contract package hash:** `da6a192c115d4696363e04e87b6ae4ee08c3269e4571fe7cf998befe09eccff1`
- **Install transaction:** `ca88a1b188e636fcd3aa0d100fcefc91f060fb500b54c44ae6d47784ae4aa250`
- **Explorer:** https://testnet.cspr.live/transaction/ca88a1b188e636fcd3aa0d100fcefc91f060fb500b54c44ae6d47784ae4aa250
- **Deployer (throwaway testnet key):** `02032cabffa474e3dcced70564922e2c8d5e9424c060fa7be405edc4921c302e0220`
- **Status:** successfully executed (2026-06-19)

## Build/deploy notes (reproducible)
- Odra 2.8.0, Rust nightly-2026-01-01, wasm32-unknown-unknown.
- `cargo odra build` produces `wasm/OutcomePay.wasm`.
- **Casper VM rejects bulk-memory ops.** Lower them before deploy:
  `wasm-opt --enable-bulk-memory --enable-sign-ext --llvm-memory-copy-fill-lowering --signext-lowering -Oz wasm/OutcomePay.wasm -o wasm/OutcomePay.wasm`
  (verify 0 ops: `wasm-dis wasm/OutcomePay.wasm | grep -cE 'memory\.copy|memory\.fill'`)
- Deploy via `cargo run --bin outcomepay_cli -- deploy` with `contract/.env`:
  `ODRA_CASPER_LIVENET_NODE_ADDRESS`, `ODRA_CASPER_LIVENET_EVENTS_URL`,
  `ODRA_CASPER_LIVENET_CHAIN_NAME=casper-test`, `ODRA_CASPER_LIVENET_SECRET_KEY_PATH`.

## On-chain lifecycle demo (all successfully executed, 2026-06-19)

Full outcome-conditioned escrow lifecycle exercised live on Casper Testnet:

| Step | Entrypoint | Transaction |
|---|---|---|
| Set on-chain budget cap | `set_cap` | https://testnet.cspr.live/transaction/7340bdf23c231ed25f3f83683bf63a9bb900551cb4810a5fcd418a5f3f8205a7 |
| Lock escrow for job 1 (payable, via proxy) | `lock` | https://testnet.cspr.live/transaction/94fc8b5decb2fb20d32409acf5cf1d5e1d1613ff163d93f7e6eddeb096480e50 |
| Settle job 1 (outcome verified → pay provider) | `settle` | https://testnet.cspr.live/transaction/48ce16128f843da89726050d1d4cf879109279830102449be740a1d71e57dcf7 |
| Lock escrow for job 2 (payable) | `lock` | https://testnet.cspr.live/transaction/6ec1dfd9eeb367ccd0d58b02084157fb68936e5fd263a5b8bcd5926b544e7b28 |
| Refund job 2 (outcome failed → green-or-no-fee) | `refund` | https://testnet.cspr.live/transaction/3a6be3bff3582f0fb96739903a82607a8c6e0621e8e1cb90e5dbe1f84b18c5b6 |

Reproduce: `outcomepay_cli scenario demo` (after deploy).

## End-to-end agent run (orchestrator, 2026-06-19)

`node agent/orchestrator.mjs` — agent locks escrow, the real gctask verifier
decides the outcome, the chain settles (pass) or refunds (fail). All on-chain:

| Job | Outcome | Lock tx | Settle/Refund tx |
|---|---|---|---|
| 11 service-A | VERIFY **PASS** → settle | https://testnet.cspr.live/transaction/3a6113b343953bde8f9be862c8fbbd1c97d2b343f5caca6b6de8f67a6845e850 | https://testnet.cspr.live/transaction/231299f4e7616f0eafb7795e3b28c983562889129a4420ecf86b89b120509a1f |
| 12 service-B | VERIFY **PARTIAL** → refund | https://testnet.cspr.live/transaction/08967c40136481886c25bca485af907f379ec90379370bdb98eb4839ea9425e8 | https://testnet.cspr.live/transaction/351bad164e78d88544e300997ba41749ce5433a6bfc255424712a29785efb6e2 |
