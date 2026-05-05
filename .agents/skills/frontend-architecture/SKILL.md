---
name: frontend-architecture
description: Apply the project's frontend architecture guidelines for Vite, React, pages, routes, layouts, feature modules, API clients, facades, hooks, Zustand stores, UI primitives, tokens, i18n, forms, errors, testing, and frontend boundaries. Use whenever Codex creates, edits, reviews, refactors, or plans frontend code under src/, client UI, React components, pages, routes, layouts, modules, stores, hooks, API clients, forms, styling, theming, or frontend tests.
---

# Frontend Architecture

## Workflow

Before changing frontend code, read `references/lineamientos-arquitectura-frontend.txt`.

Apply the referenced guidelines as the architectural source of truth:

- Organize Vite React code by responsibility: pages, routes, layouts, modules, app components, UI primitives, shared contracts, API clients, and technical clients.
- Keep pages focused on route composition and presentation state.
- Keep feature behavior inside `src/modules/<feature>` behind a small public `index.ts`.
- Prefer the flow `page -> module hook/facade -> store/api`.
- Keep API clients transport-only, and put coordination, mapping, normalization, and user-facing errors in facades, hooks, schemas, or utils.
- Use stable Zustand selectors and avoid reading whole stores or returning fresh fallback objects from selectors.
- Use semantic constants, UI tokens, i18n keys, and shared schemas instead of hardcoded values.
- Validate risky frontend changes with lint, typecheck, tests, or visual/browser checks depending on the touched surface.

When implementation details conflict with existing code, prefer the smallest change that moves the touched area toward these guidelines without unrelated refactors.
