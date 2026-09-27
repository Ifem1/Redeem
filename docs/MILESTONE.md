# Milestone: Redeem Recurring Guarantees

## Accepted baseline

Accepted baseline commit: `23551558807073dacebf5659f62217f6d9ee8cba`, the last accepted/deployed source SHA explicitly recorded in the repository's prior deployment evidence. The repository does not contain a separate adjudicator artifact certifying this as the whole-repository acceptance SHA; it remains the evidence-backed baseline and should be confirmed if a separate submission record exists.

## Milestone head

Submission compare head: the final pushed `main` HEAD after this live-proof documentation commit. The exact SHA and immutable compare URL are supplied in the submission handoff to avoid an SHA-only commit that would make its own recorded head stale.

## Before

Accepted REDEEM supported one funded guarantee, one beneficiary-opened redemption lifecycle, one semantic evaluation/challenge path, and one terminal settlement. That original path remains intact.

## New in this milestone

- Separate recurring parent creation with a bounded 2–12 epoch schedule.
- Independently claimable epochs with their own evaluation context, provisional outcome, challenge/bond, manifests, settlement, and accounting.
- Equal pre-funded epoch liability with deterministic frozen outcome-to-basis-point mapping.
- Permissionless expiry for unclaimed epochs and permissionless parent finalization/refund after all epochs are terminal.
- Bounded recurring reads and complete recurring creation, timeline, detail, and action flows in the existing frontend.
- Direct Mode and frontend milestone tests, pinned GenLayer validation, and a fresh Studionet deployment.
- A real three-epoch live protocol demonstration with independent `MET` / `MAJOR` / `MET` outcomes, three isolated challenge resolutions, nonzero payout, immutable earlier result, and parent refund/finalization. The fixture is explicitly synthetic, not production service evidence.

## Explicitly not claimed as milestone work

The one-shot lifecycle, its semantic evidence model, the prior accepted deployment, and pre-existing UI are not new milestone work. The synthetic live fixture demonstrates contract and validator workflow only; it makes no claim that a real service met or breached an SLA. No Vercel deployment is claimed.

## Deployment and verification

- Network: GenLayer Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`.
- CLI: repository-local `npx --yes genlayer@0.39.1`, version `0.39.1`.
- Fresh recurring-capable contract: `0x4a04d24fF3184c09b32dFB999096CC237DCC9f1C`.
- Deployment transaction: `0x21c56699d3b464825bee74e9a29155190d68bc093000a3534d38ba9833392a87`.
- Deployed source commit: `de017b824e4d811817cb493fbfd5648070180d0e`; deployment finalized with majority agreement and successful execution.
- Validation: GenVM `v0.3.0-rc7`, genvm-linter `0.11.0`, genlayer-test `0.29.2`; 3 lint checks passed; contract validation passed (37 methods, 18 views, 19 writes); schema generation matched the committed schema; contract typecheck and Python compilation passed.
- Direct Mode: `python -m pytest tests/direct -q` — **57 passed**.
- Frontend: `npm ci --prefix apps/web`, lint, typecheck, tests (**34 passed**) and production build passed. Vite reports a non-fatal 778.51 kB minified chunk warning.
- Live lifecycle, all 14 finalized writes, manifests, challenges, outcomes, and accounting: [RECURRING_LIVE_VERIFICATION.md](RECURRING_LIVE_VERIFICATION.md).
- Vercel deployment remains user-managed; settings are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Remaining limitations

Epoch allocations must divide the total funded amount evenly. Unused liability remains escrowed until every epoch is terminal and the parent is finalized. Validator outcomes depend on the frozen evidence source and GenLayer network. The live evidence fixture is synthetic and explicitly must not be represented as real-world service evidence.

## Compare URL

Use the exact immutable compare URL returned in the final submission handoff:

`https://github.com/Ifem1/Redeem/compare/23551558807073dacebf5659f62217f6d9ee8cba...<final-pushed-main-SHA>`
