# Live verification

Network: GenLayer Studionet (chain 61999). Canonical deployment: `0xAf5972b86E7491ea3D16CcBb45c2c7FE358f91d2`.

Source commit: `23551558807073dacebf5659f62217f6d9ee8cba`. Deployment transaction: `0xeb85d6f5ef1d2c52a4bc519d8a1ceb8d838a8d0776f3280cfe7b6df68030cbc0`.

## Verified cycle

Guarantee 1 completed: create → open → evaluate → provisional `MET` (0%) → beneficiary challenge → resolve challenge → settled denied.

- Create: `0xba7fe61a131fcfbda8620d49b7b7d415894d04723e640e5eca840a6f81e660cd`
- Challenge: `0x71f26abb794039d54aaabcd670a1c41233e5282ec56394325e5752b2149e25da`
- Readback: final `MET`, remaining `0`, beneficiary paid `0`, issuer refunded `0.02 GEN`.
- Primary manifest: round 1, `PRIMARY`, `DECIDED`, `MET`.
- Challenge manifest: round 1, `CHALLENGE`, `DECIDED`, `MET`.
- Global accounting: funded `0.02 GEN`, paid `0`, refunded `0.02 GEN`, bonds received `0.001 GEN`, bonds locked `0`, bonds forfeited `0.001 GEN`.

The successful calls were finalized with accepted consensus and successful GenVM execution.

## Evidence boundary

A second fresh cycle reaching provisional `BREACH` and settled paid was not captured in the available evidence. No Cycle B hashes or two-cycle accounting delta are claimed.
