# Recurring live verification

## Scope and evidence boundary

Network: GenLayer Studionet, chain ID `61999`, RPC `https://studio.genlayer.com/api`.

Contract: `0x4a04d24fF3184c09b32dFB999096CC237DCC9f1C`.

Parent guarantee ID: `1`. The parent was funded with `0.0006 GEN`, split evenly into three epoch liabilities of `0.0002 GEN`; each challenge bond was exactly 5% of one epoch liability (`0.00001 GEN`). The first start was Unix timestamp `1790544281`, with 3-second coverage periods and a 7,200-second claim grace.

The primary source was the immutable public file [`recurring-three-epoch.json`](https://raw.githubusercontent.com/Ifem1/Redeem/2e369614911525412b4636aa6144cb8a9ec1e1a6/demo-evidence/recurring-three-epoch.json). It is an intentionally synthetic, clearly labeled protocol fixture with one result record per epoch index. GenLayer validators fetched and classified that source in both primary and challenge reviews. This demonstrates protocol behavior and validator-driven classification; it is not evidence of an actual service's uptime or a production guarantee.

## Finalized lifecycle transactions

Every listed write reached `FINALIZED`, `MAJORITY_AGREE`, and successful execution.

| Order | Stage | Transaction | Result |
|---:|---|---|---|
| 1 | Create recurring parent 1 | `0xbc8f959333ce523988f0d89daede5a713ee739115751e5baf77e8b7060b847e3` | Finalized / success |
| 2 | Open epoch 1 (index 0) | `0xde684918361ce53a781686c1a0921c1e0cbe540be7c1759ae4f9a6fe5277a5fb` | Finalized / success |
| 3 | Evaluate epoch 1 | `0xa5a55da8f50586187cb0aaddbf33a2bc424058dcc7fce1f144c80df6870e2d1d` | Finalized / success |
| 4 | Beneficiary challenges epoch 1 | `0x8eb4b469265dfb824766274e7d6989582b8608d471027cc3caa26ce2325bb8f0` | Finalized / success |
| 5 | Resolve epoch 1 challenge | `0x39c764f2e127307558123cfacfffda6bbb6d1f9ee7bbbe2107c64905f8caea4b` | Finalized / success |
| 6 | Open epoch 2 (index 1) | `0x520e2052a1ac0622f491225c40248fa66ad4c116a9c83c47e6673600f3e88447` | Finalized / success |
| 7 | Evaluate epoch 2 | `0x72267341ebd9f5d872a410ab49667d4a4ebb8b661057575d14bd19f26dfc6f6f` | Finalized / success |
| 8 | Issuer challenges epoch 2 | `0xa2ba9da9ada84c2ed03cc7bff096a8d4fe822b4bdf33224bad9849592822060d` | Finalized / success |
| 9 | Resolve epoch 2 challenge | `0x457d31f92da1b54aed9108a9a50666558ea5cb002546305d65d060a4f5340caa` | Finalized / success |
| 10 | Open epoch 3 (index 2) | `0x6946a8a45b7eed0fe51560f5e82a263cf02f4f9d9dad690649c7edb7b15fc63c` | Finalized / success |
| 11 | Evaluate epoch 3 | `0x5502cebcaa3b8f9903b2969dc33a1666b698085c6b2527cf8ababa85cca3e7da` | Finalized / success |
| 12 | Beneficiary challenges epoch 3 | `0x78369fefaa3d42b35b03b4c25e00f5e1f7bec55b88df20bfaecc5ccc44933aac` | Finalized / success |
| 13 | Resolve epoch 3 challenge | `0xee37c52cf3009d76b67cbbf733fedbca93f16d465a94545463925891a2fbb2b4` | Finalized / success |
| 14 | Beneficiary permissionlessly finalizes parent | `0x9dfbac350e86c14d5a0bbcb65999c4804ef7c35c05798833d856fac32785aaa5` | Finalized / success |

## Independent results and manifests

| Epoch (index) | Terminal state | Final code | Paid | Refunded after parent close |
|---|---|---|---:|---:|
| 1 (0) | `SETTLED_DENIED` (status 6) | `MET` | `0 GEN` | `0.0002 GEN` |
| 2 (1) | `SETTLED_PAID` (status 5) | `MAJOR` | `0.0002 GEN` | `0 GEN` |
| 3 (2) | `SETTLED_DENIED` (status 6) | `MET` | `0 GEN` | `0.0002 GEN` |

Each epoch's primary and challenge manifest is round 1, `DECIDED`, and contains exactly one frozen source. Primary and challenge outcomes matched independently: epoch 1 `MET`, epoch 2 `MAJOR`, epoch 3 `MET`. Each manifest's `evidence_summary` names parent 1, its own zero-based epoch index, and that epoch's exact coverage interval. The reasoning string records validator consensus classification. This demonstrates each challenge and review manifest is scoped to its own epoch.

## Isolation and accounting

- After epoch 1: epoch 1 was terminal `MET` with zero payout; parent remained `ACTIVE`, `funded=0.0006`, `paid=0`, `remaining=0.0006`, `refunded=0`; epoch 2 was still pending.
- After epoch 2: epoch 2 was terminal `MAJOR` with `0.0002 GEN` paid; parent remained active with `paid=0.0002`, `remaining=0.0004`, `refunded=0`. Epoch 1 remained terminal `MET`; epoch 3 was pending.
- After epoch 3: epoch 3 was terminal `MET`; parent remained active with `paid=0.0002`, `remaining=0.0004`, `refunded=0`.
- After parent finalization: parent status `6` (terminal), `funded=0.0006`, `paid=0.0002`, `refunded=0.0004`, `remaining=0`.

All figures are GEN. Raw accounting identity: `600000000000000 = 0 + 200000000000000 + 400000000000000`. The three epoch paid amounts sum to parent paid; after closure, epoch paid plus refunded amounts sum to parent funded.

All three challenges reclassified the same frozen fixture result as the primary review; none changed the provisional code. Each exact `0.00001 GEN` bond was consequently unsuccessful and forfeited to the opposing party. Contract-wide bond readback: `30000000000000` raw units received, `0` locked, `0` returned to challengers, `30000000000000` forfeited. Direct Mode tests cover the successful challenge branch as well. No intentionally failing guard transaction was submitted.

## Final readback

After parent finalization, read-only calls confirmed the parent terminal state and accounting above, all three immutable terminal epoch outcomes, and all six correctly scoped primary/challenge manifests. The contract-wide accounting also read `funded=600000000000000`, `paid=200000000000000`, `refunded=400000000000000`, `remaining=0`.
