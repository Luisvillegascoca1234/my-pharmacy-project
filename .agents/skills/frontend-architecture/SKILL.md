---
name: frontend-architecture
description: Apply the project's frontend architecture guidelines for Vite, React, pages, routes, layouts, feature modules, API clients, facades, hooks, Zustand stores, UI primitives, tokens, i18n, forms, errors, testing, and frontend boundaries. Use whenever Codex creates, edits, reviews, refactors, or plans frontend code under src/, client UI, React components, pages, routes, layouts, modules, stores, hooks, API clients, forms, styling, theming, or frontend tests.
---

# Frontend Architecture

## Workflow

Before changing frontend code, read `references/lineamientos-arquitectura-frontend.txt`.

Apply the referenced guidelines as the architectural source of truth:

- Organize Vite React code by responsibility: pages, routes, layouts, app components, UI primitives, shared contracts, API clients, technical clients, and portable data modules.
- Keep pages focused on route composition and presentation state.
- Keep feature data behavior inside `src/modules/<feature>` behind a small public `index.ts`.
- Treat `src/modules` as a portable data layer that could be packaged for another UI such as React Native.
- Never put React components, JSX/TSX, DOM/browser UI APIs, Tailwind/CSS, icons, layouts, routes, page copy, labels, placeholders, or other visual concerns inside `src/modules`.
- Keep UI tied to a feature in `src/pages` or `src/components`, consuming only public module hooks/facades/selectors.
- Prefer the flow `page -> module hook/facade -> store/api`.
- Keep API clients transport-only: build endpoints, pass params/payloads, and return `response.data`.
- Put coordination, mapping, normalization, and data-oriented errors in facades, hooks, schemas, or utils; keep final visible copy in UI or i18n.
- Keep module stores split into `State`, `Actions`, `Selectors`, and `Store`; stores coordinate data only and must not navigate, show toasts, open modals, or import UI.
- Use stable Zustand selectors and avoid reading whole stores or returning fresh fallback objects from selectors.
- Use semantic data constants in modules; UI labels, display mappings, tokens, i18n keys, and styling decisions belong outside `src/modules`.
- When reviewing or editing `src/modules`, reject or remove `components/`, `.tsx`, UI imports, router imports, DOM globals, and visual copy.
- Validate risky frontend changes with lint, typecheck, tests, or visual/browser checks depending on the touched surface.

When implementation details conflict with existing code, prefer the smallest change that moves the touched area toward these guidelines without unrelated refactors.
