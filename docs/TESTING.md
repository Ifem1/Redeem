# Testing

Direct tests prove authorization, time bounds, exact funding, outcome validation, accounting, terminal-state protection, retry behavior, and challenge-bond conservation. Integration tests must be run against a real GenLayer environment for web/LLM behavior; such tests are not substitutes for deterministic direct tests.
Direct Mode currently contains 47 passing tests. The suite deploys the Redeem contract with gltest's direct_deploy fixture and invokes public methods for funding, validation, bounded reads, rule reads, constants, expiry, and rejection paths. CI uses the pinned versions in requirements.txt and runs lint, validation, schema drift, typecheck, and pytest.
