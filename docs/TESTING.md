# Testing and validation

The milestone verification was rerun after the live demonstration.

## Direct Mode

Command: `python -m pytest tests/direct -q`

Result: **57 passed**.

Recurring Direct Mode cases cover bounded creation, equal liability allocation, early-claim rejection, expired epochs, independent outcomes and payouts, per-epoch challenge isolation, and parent finalization/refunds.

## Frontend

Commands, run after `npm ci --prefix apps/web`:

- `npm run lint --prefix apps/web` — passed.
- `npm run typecheck --prefix apps/web` — passed.
- `npm test --prefix apps/web` — **34 passed** across 3 test files.
- `npm run build --prefix apps/web` — passed. Vite reports a non-fatal 778.51 kB minified JavaScript chunk warning.

## GenLayer contract

Using GenVM runner `v0.3.0-rc7`, genvm-linter `0.11.0`, and genlayer-test `0.29.2`:

- `genvm-lint check contracts/redeem.py --json` — passed, 3 checks.
- `genvm-lint validate contracts/redeem.py --json` — passed; 37 methods, 18 views, 19 writes. It reports an informational notice that a newer runner is available; the pinned runner matches this Studionet deployment/toolchain.
- `genvm-lint schema contracts/redeem.py --output artifacts/redeem.schema.json` — passed; generated schema matches the committed artifact.
- `genvm-lint typecheck contracts/redeem.py` — passed, no type errors.
- `python -m py_compile contracts/redeem.py tests/direct/test_recurring.py` — passed.
- `git diff --check` — passed.

One initial validator attempt could not reach the SDK endpoint from the restricted shell; rerunning with network access and the pinned runner succeeded. This was an environment access issue, not a contract failure.

## Live proof

The separate Studionet 61999 three-epoch proof, all finalized transaction hashes, manifests, and accounting are recorded in [RECURRING_LIVE_VERIFICATION.md](RECURRING_LIVE_VERIFICATION.md). The evidence fixture is explicitly synthetic and demonstrates protocol operation; it is not a real-world service attestation.
