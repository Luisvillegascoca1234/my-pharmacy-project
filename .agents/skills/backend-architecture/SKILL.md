---
name: backend-architecture
description: Apply the project's backend architecture guidelines for Express, TypeScript, Prisma, PostgreSQL, modular layers, repositories, services, controllers, transactions, inventory, sales, billing, audit, tests, and shared contracts. Use whenever Codex creates, edits, reviews, refactors, or plans backend code under backend/, prisma/, packages/shared backend contracts, API routes, controllers, services, repositories, database access, domain modules, or backend tests.
---

# Backend Architecture

## Workflow

Before changing backend code, read `references/lineamientos-arquitectura-backend.md`.

Apply the referenced guidelines as the architectural source of truth:

- Keep the backend as a modular monolith with Express, TypeScript, Prisma, and PostgreSQL.
- Preserve module mini-stacks: routes, controllers, services, repositories, and types.
- Keep HTTP concerns in routes/controllers, domain rules in services, and Prisma access in repositories.
- Use explicit transactions for purchases, sales, cash, inventory, returns, billing, and other multi-step domain flows.
- Keep Prisma away from frontend, controllers, and shared packages.
- Keep Zod schemas and shared contracts in `packages` when they are consumed by both frontend and backend.
- Treat inventory movements, audit, FEFO, lots, billing separation, and SIAT state as mandatory business boundaries when relevant.

When implementation details conflict with existing code, prefer the smallest change that moves the touched area toward these guidelines without unrelated refactors.
