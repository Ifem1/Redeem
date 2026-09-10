# Architecture

The protocol has three boundaries: immutable guarantee terms, nondeterministic evidence classification, and deterministic settlement. The beneficiary alone opens a redemption. A permissionless evaluator runs GenLayer consensus. The accepted outcome is a code, never an amount; the frozen payout table supplies the amount.

The production state machine is ACTIVE → REDEMPTION_OPEN → PROVISIONAL → CHALLENGED or terminal settlement. Retryable source failures are never treated as denial and must end in an explicit refund path after bounded grace.
