# Architecture

The protocol has three boundaries: immutable guarantee terms, nondeterministic evidence classification, and deterministic settlement. The beneficiary alone opens a redemption. A permissionless evaluator runs GenLayer consensus. The accepted outcome is a code, never an amount; the frozen payout table supplies the amount.

The production state machine is ACTIVE → REDEMPTION_OPEN → PROVISIONAL → CHALLENGED or terminal settlement. Retryable source failures are never treated as denial and must end in an explicit refund path after bounded grace.

## Recurring parent and epochs

Recurring agreements use a separate creation path and storage model, leaving the one-shot methods and semantics in place. A parent freezes issuer, beneficiary, title, terms, evidence source rules, outcome/payout table, total funding, count, fixed duration, first start, final end, and claim grace. Epoch count is bounded at 2–12. This bound caps deterministic loops in parent finalization and limits stored epoch records. Epoch IDs are `(parent_id, zero_based_index)`; the storage key uses `parent_id * 16 + index`.

The parent total funding must divide evenly into epoch count, producing an immutable equal liability per epoch. Claims open only after that epoch's coverage end, through its frozen claim deadline. Each epoch has independent review attempts, provisional result, challenge bond and state, final outcome, payout, and evidence manifest. Semantic review receives the parent ID, index, exact coverage boundaries, terms, sources, and allowed outcome table. It returns only a code; contract arithmetic decides value.

Epoch settlement pays only that epoch's deterministic payout and reduces the parent's remaining liability by that amount. Its unused allocation remains in parent escrow until parent finalization. An expired unclaimed epoch becomes terminal without a verdict; its allocation likewise remains available for final parent refund. Once all epochs are terminal, anyone may finalize the parent; the parent returns all remaining liability to the issuer, records unused amounts against each epoch, and becomes terminal. Parent accounting is `funded = remaining + paid + refunded` before finalization and `funded = paid + refunded` after it. Epoch accounting reconciles as `sum(epoch.paid) = parent.paid`; at terminal parent closure `sum(epoch.paid + epoch.refunded) = parent.funded`.

Challenge and retry windows mirror the single guarantee policy. Storage grows linearly with the bounded epoch count; individual parent and epoch reads are bounded, and recurring listing accepts a maximum page size of 25. A future start and positive duration/grace are required; source-network clock semantics follow GenLayer block datetime. Review manifests are keyed deterministically by parent, epoch, phase, and bounded attempt.
