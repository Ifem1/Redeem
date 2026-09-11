# Contract review

| Invariant | Enforcement | Direct test | Live proof |
|---|---|---|---|
| exact funding | payable value equals escrow | test_direct_creation_rejects_wrong_value | creation finalized |
| beneficiary binding | distinct issuer; beneficiary-only open | test_direct_creation_rejects_issuer_as_beneficiary | open finalized |
| bounded reads | maximum page size 25 | test_direct_reads_are_bounded | not yet deployed |
| frozen rules | strict source/outcome JSON validation | test_direct_source_and_outcome_manifest_reads | creation finalized |
| expiry refund | remaining escrow zeroed before refund | test_direct_expiry_refunds_escrow | not yet deployed |
| timing | strict windows and finite recovery | contract timing tests | not yet deployed |
| accounting | funded = remaining + paid + refunded | accounting tests | live read verified |
| manifests | phase/round namespace separation | manifest tests | primary round 1 read |
