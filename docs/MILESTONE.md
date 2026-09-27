# Milestone: Redeem Recurring Guarantees

## Accepted baseline

Accepted baseline commit: `23551558807073dacebf5659f62217f6d9ee8cba` (the last accepted/deployed source SHA explicitly recorded in the repository's README and deployment evidence). The repository does not include a separate adjudicator artifact certifying this as the whole-repository acceptance SHA. Confirm the intended compare base before external submission; this SHA is evidence-backed, not independently adjudicated here.

## Milestone head

Final milestone SHA: `192044e3dc340896d1a2cb21098643b3c6273a36`.

## Before

The accepted REDEEM contract supports a funded single guarantee, one beneficiary-opened redemption, one evidence evaluation/challenge lifecycle, and one terminal settlement. That mode remains available through the original methods.

## New in this milestone

- A distinct recurring parent creation mode with a fixed schedule of 2–12 epochs.
- Independently claimable epoch records, reviews, provisional decisions, challenges, terminal results, and manifests.
- Exact pre-funding with equal epoch allocations and frozen outcome-to-basis-point mappings; semantic review returns a code and never a monetary amount.
- Permissionless expiry for unclaimed epochs and parent finalization/refund after all epochs are terminal.
- Bounded recurring reads, recurring creation and history/action flows in the frontend, Direct Mode tests, frontend tests, and CI validation.
- A fresh Studionet deployment of the recurring-capable contract.

## Explicitly not claimed as milestone work

The existing one-shot lifecycle, evidence review model, original deployment, visual identity, and prior frontend behavior predate this milestone. The recurring milestone does not claim a completed live multi-epoch transaction demonstration: this environment has no available signer key for the deployed issuer or beneficiary, so no recurring guarantee or epoch action was broadcast.

## Deployment and verification

- Network: GenLayer Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- CLI: repository command `npx --yes genlayer@0.39.1`; version used: `0.39.1`.
- Contract: `0x4a04d24fF3184c09b32dFB999096CC237DCC9f1C`.
- Deployment transaction: `0x21c56699d3b464825bee74e9a29155190d68bc093000a3534d38ba9833392a87`.
- Source commit deployed: `de017b824e4d811817cb493fbfd5648070180d0e`.
- Deployment receipt finalized with majority agreement and successful leader execution.
- GenVM runner used for validation/Direct Mode: `v0.3.0-rc7`; genvm-linter `0.11.0`; genlayer-test `0.29.2`.
- Contract lint (3 checks), contract validation (37 methods, 18 views, 19 writes), schema generation, typecheck, and Python compilation passed.
- Direct Mode suite: `pytest tests/direct -q` — 57 passed.
- Frontend: `npm run lint`, `npm run typecheck`, `npm test` (34 passed), and `npm run build` passed. Vite reported a non-fatal large chunk warning (~778 KB).
- Live recurring epoch demonstration: pending signer access. Deployment is real; no recurring transactions or outcomes are claimed.
- Frontend deployment: not performed. The user will deploy through Vercel using documented `VITE_REDEEM_*` variables.

## Residual limitations

The live three-epoch demonstration remains outstanding. Review and challenge outcomes depend on GenLayer network validators and external evidence availability; no production deployment is claimed. Equal per-epoch liability is required, and parent unused liability remains escrowed until all epochs are terminal and the parent is finalized.

## Compare URL

[https://github.com/Ifem1/Redeem/compare/](https://github.com/Ifem1/Redeem/compare/)`23551558807073dacebf5659f62217f6d9ee8cba`...`192044e3dc340896d1a2cb21098643b3c6273a36`
