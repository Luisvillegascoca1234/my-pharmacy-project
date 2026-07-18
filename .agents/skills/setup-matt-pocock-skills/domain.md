# Domain Docs

How engineering skills consume this repository's domain documentation.

## Before working

- Read root `CONTEXT.md`, or root `CONTEXT-MAP.md` when it points to multiple contexts.
- Read ADRs relevant to the domain area being changed.

If these resources do not exist, proceed silently. Do not flag their absence or propose creating them upfront. Domain-modeling work creates them when terminology or decisions are resolved.

## Layout

For a single context, keep the shared glossary in root `CONTEXT.md` and decisions in `docs/adr/`.

For multiple contexts, keep the index in root `CONTEXT-MAP.md`, point it to the relevant context glossaries, and keep system-wide decisions in `docs/adr/`.

## Vocabulary

Use the glossary's exact term whenever an output names a domain concept. Do not drift toward synonyms the glossary rejects.

If a required concept is absent, reconsider whether the new term belongs to the project or record the gap for domain modeling.

## ADR conflicts

Surface any conflict with an existing ADR explicitly instead of silently overriding the decision.

