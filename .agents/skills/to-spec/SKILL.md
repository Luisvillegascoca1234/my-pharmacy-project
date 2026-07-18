---
name: to-spec
description: Turn an agreed grilling conversation into the canonical feature spec consumed by to-tickets, including user-centered tracer bullets, QA journeys, and user-documentation scope. Use after grilling has resolved the important product and technical decisions.
disable-model-invocation: true
---

# To Spec

Turn the decisions already reached through `grilling` into a canonical feature spec. Synthesize; do not start another interview.

## Preconditions

- Require an agreed grilling conversation as the source.
- Require the repo's issue-tracker and domain-doc configuration. Run `/setup-matt-pocock-skills` if it is missing.
- If a material product or technical decision is still unresolved, stop and direct the user back to `grilling`. Do not guess and do not resolve it inside this skill.

## Process

### 1. Gather the agreed context

Read the current conversation and any artifacts it references. Preserve the user's decisions, terminology, scope boundaries, and corrections.

### 2. Explore the repo

Understand the current behavior and relevant constraints if the repo has not already been explored. Use the domain glossary's vocabulary and respect applicable ADRs.

Identify the highest practical testing seams. Prefer existing seams, minimize new ones, and record the resulting decisions in the spec. If choosing a seam would introduce a new material decision, return to `grilling`.

### 3. Define tracer bullets

Divide the feature into ordered tracer bullets. Each tracer bullet must deliver one narrow, complete, user-observable behavior through backend and UI. The tracer bullet is the vertical slice; its later tickets are the sequential stages used to deliver it.

For every tracer bullet, specify:

- the user outcome;
- the backend responsibility;
- the UI behavior;
- the Computer Use journey that final QA can execute;
- acceptance criteria stated as observable behavior.

Order tracer bullets so the first establishes the thinnest useful path and later bullets build on already reviewed behavior. Do not make an earlier tracer bullet depend on a later one.

Wide mechanical refactors remain exceptional. Describe an expand-contract sequence when a refactor cannot land safely as a vertical slice.

### 4. Write the spec

Use the template below. Do not include specific file paths or implementation snippets because they become stale quickly.

The only snippet exception is a prototype artifact that encodes a decision more precisely than prose. Inline only the decision-rich fragment and identify it as prototype-derived.

<spec-template>

# <Feature name>

## Problem Statement

Describe the problem from the user's perspective.

## Solution

Describe the solution from the user's perspective.

## User Stories

Provide a comprehensive numbered list in this form:

1. As an <actor>, I want <capability>, so that <benefit>.

Cover the complete agreed scope without inventing requirements.

## Tracer Bullets

### TB-01 — <User-observable outcome>

**User outcome:** <value delivered to the user>

**Backend responsibility:** <business behavior, persistence, API, and shared contracts required>

**UI behavior:** <client experience and integration required>

**QA journey:** <steps final Computer Use QA can perform and observe>

**Acceptance criteria:**

- <observable criterion>

Repeat in execution order as `TB-02`, `TB-03`, and so on.

## Implementation Decisions

Record the agreed technical decisions, including modules, interfaces, architecture, schemas, contracts, and interactions. Describe responsibilities without file paths.

## Testing Decisions

Describe external behavior to test, selected testing seams, relevant modules, and useful prior art. Do not test implementation details.

## QA Decisions

Describe cross-tracer journeys, error states, and any environment assumptions final Computer Use QA must cover. QA occurs once, after every tracer bullet has passed Code Review, and may correct defects before re-running affected journeys.

## User Documentation

Describe the user-facing topics that must be documented after QA validates the feature. Use the project's pharmaceutical vocabulary and exclude code organization or implementation details.

## Out of Scope

List what this spec deliberately excludes.

## Further Notes

Record any remaining non-blocking context.

</spec-template>

### 5. Publish the canonical spec

Publish the approved spec to the configured tracker.

- For the local Markdown tracker, write `.scratch/<feature-slug>/spec.md` and create the feature directory if needed.
- For an external tracker, publish one canonical spec issue and retain its stable URL or identifier.

Return the exact spec reference. `/to-tickets` must use that reference in every generated ticket.
