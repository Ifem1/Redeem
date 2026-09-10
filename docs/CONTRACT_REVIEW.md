# Contract review matrix

| Invariant | Contract code | Direct test | Live proof |
|---|---|---|---|
| beneficiary is bound at creation | `create_guarantee` | pending | pending deployment |
| payout is precommitted | outcome storage/design | pending | pending deployment |
| evaluation is permissionless | state machine design | pending | pending deployment |
| source failure is not denial | retry design | pending | pending deployment |
| no admin settlement | no admin surface | pending | pending deployment |
| Invariant | Enforcement | Direct test | Live proof |
|---|---|---|---|
| exact funding | payable value equals escrow | test_direct_creation_rejects_wrong_value | not yet deployed |
| beneficiary binding | issuer cannot self-name; beneficiary opens | test_direct_creation_rejects_issuer_as_beneficiary | not yet deployed |
| bounded reads | page size capped at 25 | test_direct_reads_are_bounded | not yet deployed |
| expiry refund | remaining escrow returned once | test_direct_expiry_refunds_escrow | not yet deployed |
| source and outcome schema | frozen JSON validation | test_direct_source_and_outcome_manifest_reads | not yet deployed |
