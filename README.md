# Redeem

Promises, backed before they break.

Redeem is a GenLayer-native escrow protocol for one issuer and one named beneficiary. The issuer funds a guarantee whose terms, approved public sources, outcome classes, and payout matrix are frozen at creation. Validators independently inspect the sources; deterministic contract logic maps the agreed outcome to the precommitted payout.

## Status

This repository contains the initial implementation scaffold. It is not deployed or live until a deployment address and verification evidence are added here.

## Development

```bash
genvm-lint check contracts/redeem.py --json
genvm-lint schema contracts/redeem.py --output artifacts/redeem.schema.json
genvm-lint typecheck contracts/redeem.py
pytest tests/direct -v
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/SECURITY.md](docs/SECURITY.md), and [docs/CONTRACT_REVIEW.md](docs/CONTRACT_REVIEW.md).
