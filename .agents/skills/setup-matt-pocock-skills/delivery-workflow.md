# Delivery Workflow

Use this mandatory flow for feature work:

```text
grilling -> to-spec -> to-tickets
-> TB-01 Backend -> TB-01 UI -> TB-01 Code Review
-> TB-02 Backend -> TB-02 UI -> TB-02 Code Review
-> ... -> QA -> Docs
```

## Canonical spec

`grilling` resolves material decisions. `/to-spec` synthesizes them into the canonical spec without opening a new interview. `/to-tickets` reads only that published spec, and every generated ticket links back to it.

## Tracer bullets

Each tracer bullet is one narrow, complete, user-observable behavior. Deliver it through three sequential tickets:

1. `BACKEND` implements server behavior and required shared contracts.
2. `UI` implements the Spanish client experience and integration.
3. `CODE REVIEW` reviews and corrects the complete tracer bullet, including code slop.

`TB-01 Backend` has no blocker. Every later ticket depends on the immediately preceding ticket, so `TB-(N+1) Backend` depends on `TB-N Code Review`. Never work tracer bullets in parallel.

## Status lifecycle

Use only `TODO` and `DONE`. Every new ticket starts as `TODO` and changes to `DONE` only after satisfying its acceptance criteria. Always work the lowest-numbered available `TODO`; do not skip an earlier one.

## Corrective authority

Code Review may change backend, frontend, shared contracts, and tests to correct findings. It is not report-only and does not perform visual QA.

Final QA runs only after the last Code Review. The QA ticket is explicit authorization to use Computer Use through the in-app browser, correct defects across the implementation, and repeat affected spec journeys. Read root `AGENTS.md` before QA and follow its environment and language rules.

## User documentation

Docs runs only after QA is `DONE`. Document only QA-validated behavior in Spanish, using specialized pharmaceutical terminology. Do not describe code organization or implementation details.

