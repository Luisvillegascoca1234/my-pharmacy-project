# Ticket 08 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 06, 07
- Blocks: 09

## Description

Clean up dead code, duplicate wiring, stale references, temporary instrumentation, and naming drift exposed by reports, exports, and audit UI work. Keep the cleanup limited to sprint-touched frontend paths and planning references.

## Scope

- sprint-touched report, export, audit, route, navigation and test files
- temporary adapters, placeholders or instrumentation introduced by the sprint
- providers, exports, helpers and references touched while wiring analysis surfaces
- stale imports or duplicate helpers around CSV downloads, audit metadata and date filters

## Out Of Scope

- broad cleanup outside the sprint scope
- new functional changes
- later-sprint docs, thesis or OpenAPI work

## Acceptance Criteria

- no obvious dead code remains in the sprint-touched paths
- no duplicate handlers, stores, providers or wrappers remain without a clear reason
- imports, exports, naming, and references reflect a coherent post-sprint shape
- deferred debt is documented explicitly instead of being left as accidental drift
