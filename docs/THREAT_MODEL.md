# Threat model

| Asset | Attacker | Defense |
|---|---|---|
| Escrow | stranger | caller checks and zero-before-transfer settlement |
| Valid payout | issuer | immutable terms and permissionless evaluation |
| False payout | beneficiary | frozen sources, independent consensus, challenge round |
| Liveness | source outage | bounded retry and explicit inconclusive refund |
| User trust | compromised UI/API | contract-only financial authority and fail-closed actions |
