# Testing

There are 47 Direct Mode tests. They deploy Redeem with direct_deploy and invoke public methods for funding, validation, authorization, bounded reads, rule reads, constants, expiry, accounting, and terminal protection. Nondeterministic review is isolated from deterministic assertions. CI uses pinned genlayer-test 0.29.2, genvm-linter 0.11.0, and pytest 9.1.1, followed by web lint, typecheck, Vitest, and build.
