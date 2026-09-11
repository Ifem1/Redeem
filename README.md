# REDEEM

> Promises, backed before they break.

Redeem is an escrow-backed guarantee protocol for measurable real-world promises. An issuer names one beneficiary and pre-funds the maximum liability. At creation, the Intelligent Contract freezes the terms, beneficiary, coverage period, HTTPS evidence sources and authority roles, outcome classes, payout matrix, and claim deadline.

When redemption occurs, GenLayer validators independently inspect the frozen public evidence and classify the result. They do not decide how much money to pay: they return a frozen outcome code. Deterministic contract logic maps that code to the payout committed at creation.

**AI classifies. Deterministic code pays.**

## Why Redeem needs GenLayer

A normal smart contract can enforce arithmetic and permissions, but it cannot determine whether an external semantic promise—such as an uptime SLA, delivery commitment, service availability, published milestone, or public operational condition—was met. The relevant facts live outside the chain and often require interpretation.

A centralized backend or single LLM API creates a centralized judge. One operator controls retrieval and interpretation, so one operator can bias the financial result. Redeem uses GenLayer validators to independently fetch the frozen HTTPS sources through nondeterministic web access. Comparative consensus constrains classification. Agreement produces a frozen outcome code; deterministic contract code computes settlement. The model cannot change beneficiaries, terms, escrow, payouts, or evidence authority.

## Status

| Area | Verified status |
|---|---|
| Intelligent Contract | `contracts/redeem.py`, deployed source commit `0dd6b7e` |
| Frontend | React/Vite/TypeScript in `apps/web/` |
| Network | GenLayer Studionet, chain ID `61999` |
| Contract | `0x32Eb76d30f27856C2310D8f3C4d244B1fEEBBcb2` |
| Deployment transaction | `0x969e9d3ec1e69f9110e0fcd9cc8888e1c4aea7764b8781681631868a28c9ec30` |
| Tests | 47 pytest total; 11 use `direct_deploy`; 21 frontend Vitest tests |
| CI | Contract, web, and hygiene jobs are configured; verify the latest run in Actions |

Frontend-only commits do not invalidate this deployment because `contracts/redeem.py` has remained unchanged.

## How it works

1. The issuer creates a guarantee for one beneficiary.
2. The contract validates and freezes terms, sources, authority roles, outcomes, and payout basis points.
3. The issuer sends the exact maximum escrow.
4. The beneficiary opens redemption after the evaluation time and before the claim deadline.
5. Permissionless evaluation asks GenLayer validators to inspect the frozen evidence.
6. A decided code becomes provisional; source or model failure becomes retryable.
7. Issuer or beneficiary may challenge before the deadline with the exact 5% bond.
8. The contract maps the final frozen code to basis points and settles deterministically.

States are `ACTIVE`, `REDEMPTION_OPEN`, `RETRYABLE`, `PROVISIONAL`, `CHALLENGED`, `SETTLED_PAID`, `SETTLED_DENIED`, `EXPIRED_REFUNDED`, and `INCONCLUSIVE_REFUNDED`.

## Example

An uptime provider escrows 50 GEN for a 99.9% promise. An explanatory matrix could be `MET` = 0%, `MINOR_BREACH` = 40%, and `MAJOR_BREACH` = 100%. If validators classify `MAJOR_BREACH`, the contract applies the committed 100%; it does not ask an LLM what compensation feels fair. This example is explanatory, not live data.

## Evidence and source authority

Each guarantee has one to four HTTPS sources. `PRIMARY` is authoritative for the facts it covers. `CORROBORATING` supports but cannot silently override clear primary evidence. A required source being unavailable is not automatic denial: it can produce `SOURCE_UNAVAILABLE` and a retryable state. Material conflict among required authoritative sources may produce `INCONCLUSIVE` when the terms cannot resolve it.

Evidence is data, never instructions. Validators cannot follow commands in fetched pages, invent replacement sources, follow evidence links as new authority, or introduce a claimant-selected authority after issuance. Source rules are frozen at creation.

## AI classifies. Deterministic code pays.

Review is constrained to frozen terms, sources, and outcome codes. It cannot add beneficiaries, change escrow, alter terms, invent payouts, or select arbitrary compensation. Settlement is:

```text
escrow_total × payout_bps / 10000
```

The contract performs this calculation and records the terminal accounting.

## Challenges

A provisional result does not immediately settle. The issuer or beneficiary can challenge before the deadline by paying exactly 5% of escrow. A challenge triggers a second review under the same frozen policy. A beneficiary challenge succeeds only if the final payout is higher; an issuer challenge succeeds only if it is lower. A successful challenger gets the bond back; an unsuccessful challenge forfeits it to the counterparty. There is no admin settlement authority.

## Failure handling and liveness

Source failure and invalid model output can enter `RETRYABLE`, not claimant failure. Attempts are spaced and bounded, with one finite final recovery interval. Fallback closes unresolved redemption after that interval. Stalled challenges have a permissionless fallback, and unopened expired guarantees can be reclaimed. Funds are not intended to remain trapped indefinitely.

## Escrow and accounting safety

Funding is exact: underpayment and overpayment are rejected. Challenge bonds are separate from escrow. Settlement zeroes accounting before transfers where applicable, and terminal states cannot settle twice.

```text
escrow_total = escrow_remaining + beneficiary_paid + issuer_refunded
bonds_received = bonds_locked + bonds_returned + bonds_forfeited
```

## Contract surface

The contract exposes 21 public methods: 9 writes and 12 reads.

Writes: `create_guarantee`, `open_redemption`, `evaluate_redemption`, `challenge_redemption`, `resolve_challenge`, `finalize_redemption`, `reclaim_expired_guarantee`, `finalize_inconclusive`, `finalize_stalled_challenge`.

Reads: `get_guarantee`, `get_guarantee_counter`, `get_guarantee_accounting`, `get_contract_accounting`, `get_constants`, `get_source_rule`, `get_outcome_rule`, `get_evidence_manifest`, `status_label`, `list_guarantees`, `list_guarantees_by_issuer`, and `list_guarantees_by_beneficiary`. List reads are bounded.

## Application

The application provides Overview, Issue Guarantee, Guarantees, Guarantee Detail, My Rights, My Issued, Activity, and About. Public state uses an account-free GenLayer read client. Writes and wallet-filtered views use an external injected wallet. The app does not generate, import, export, or custody private keys. Financial actions fail closed when state, wallet, timing, or exact bond requirements are unknown or invalid.

## Testing and verification

There are 47 pytest tests total. 11 use `direct_deploy` and execute Redeem through the Direct Mode runtime; the remainder are static, helper, or protocol-rule tests. Direct tests cover deployment, exact creation funding, immutable terms, authorization, bounded reads, rules, constants, accounting reads, expiry refund, and unknown guarantees. Review-to-settlement and challenge-resolution are not yet successful Direct Mode proofs: the current attempted `c.open_redemption(1)` fails at `contracts/redeem.py:82` after sender change in the pinned `genlayer-test==0.29.2` fixture. Frontend tests cover payload, GEN units, bond, lifecycle, and guards.

Pinned tools are `genlayer-test==0.29.2`, `genvm-linter==0.11.0`, and `pytest==9.1.1`. Web commands are:

```powershell
npm ci --prefix apps/web
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm test --prefix apps/web
npm run build --prefix apps/web
```

## Security properties

Beneficiary binding, immutable terms, exact funding, bounded HTTPS sources, frozen authority roles, no arbitrary model payout, bounded retries and challenge windows, exact bonds, permissionless actions, accounting conservation, bounded reads, and fail-closed frontend controls are enforced or tested as documented in [SECURITY.md](docs/SECURITY.md), [THREAT_MODEL.md](docs/THREAT_MODEL.md), and [CONTRACT_REVIEW.md](docs/CONTRACT_REVIEW.md).

## Scope and known boundaries

V1 deliberately focuses on one guarantee, one issuer, one named beneficiary, and one bounded maximum liability. It excludes pooled guarantees, transferable positions, NFTs/tokens, governance, reputation, cross-chain settlement, upgradeable/admin settlement, claimant-added authority, and backend/indexer dependency.

## Repository structure

`contracts/` contract source · `tests/` tests · `apps/web/` frontend · `scripts/` deployment utilities · `docs/` technical documentation · `artifacts/` generated schema · `.github/` CI.

## Local development

```powershell
genvm-linter contracts/redeem.py
genlayer-cli contract validate contracts/redeem.py
genlayer-cli contract schema contracts/redeem.py
pytest -q
npm ci --prefix apps/web
npm run dev --prefix apps/web
npm run lint --prefix apps/web
npm run typecheck --prefix apps/web
npm test --prefix apps/web
npm run build --prefix apps/web
```

Configure `VITE_REDEEM_CONTRACT_ADDRESS` from `.env.example`; never commit secrets.

## Documentation

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | State machine and boundaries |
| [SECURITY.md](docs/SECURITY.md) | Security controls |
| [THREAT_MODEL.md](docs/THREAT_MODEL.md) | Attacker stories and residual risk |
| [CONTRACT_REVIEW.md](docs/CONTRACT_REVIEW.md) | Invariant review matrix |
| [TESTING.md](docs/TESTING.md) | Counts, commands, limitations |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Studionet procedure and evidence |
| [ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment configuration |

## Deployment

The current candidate contract is deployed on GenLayer Studionet 61999 at `0x32Eb76d30f27856C2310D8f3C4d244B1fEEBBcb2`. Its deployment transaction is `0xaab4d4db73b0438c18eca838ae7f7fd95cf3f8bf9eb2ca5139bd3800ad760b7e`. The frontend uses that address through `VITE_REDEEM_CONTRACT_ADDRESS`. Live evaluation remains subject to validator consensus.
