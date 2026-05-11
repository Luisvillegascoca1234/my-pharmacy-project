# Ticket 06 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05
- Blocks: 07

## Description

Limpiar codigo muerto, wiring duplicado, referencias stale, instrumentacion temporal y drift de nombres expuesto por el trabajo del sprint Backend De Compras E Inventario, enfocandose solo en los paths tocados por compras e inventario backend.

## Scope

- `backend/src/modules/purchases`
- `backend/src/modules/inventory`
- `backend/src/routes/index.ts`
- `backend/src/docs/openapi.ts`
- imports, exports, helpers, tipos y referencias tocadas por el sprint
- instrumentacion temporal o adaptadores creados durante implementacion

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors reservados para sprints posteriores
- frontend, stores Zustand o pantallas

## Acceptance Criteria

- no queda codigo muerto obvio en rutas, controllers, services, repositories, helpers o docs tocados por el sprint
- no quedan handlers, services, wrappers o helpers duplicados sin razon explicita
- imports, exports, nombres y referencias reflejan una forma coherente posterior al sprint
- los errores y codigos publicados son consistentes entre service, controller y OpenAPI
- deuda diferida se documenta explicitamente en el ticket o PRD en vez de quedar como accidente

## Cleanup Notes

- Removed stale module placeholder files after `purchases` and `inventory` gained real backend files.
- Removed the redundant nullable text comparison wrapper in inventory layer validation.
- Added missing OpenAPI purchase error examples for backend service errors exposed by this sprint.
