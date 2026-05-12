# Ticket 05 - Verify OpenAPI Contract Parity For Suppliers And Purchases

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Revisar y ajustar la documentacion OpenAPI minima para que `suppliers` y `purchases` reflejen los contratos compartidos, rutas montadas y errores reales despues de los sprints backend. Este ticket no crea endpoints nuevos; solo corrige divergencias entre `backend/src/docs/openapi.ts`, schemas Zod compartidos y controllers/routes existentes.

## Scope

- `backend/src/docs/openapi.ts`
- contratos compartidos de proveedores, compras, items, recepcion, anulacion y paginacion
- rutas `backend/src/modules/suppliers/suppliers.routes.ts`
- rutas `backend/src/modules/purchases/purchases.routes.ts`
- codigos de error usados por services y controllers

## Out Of Scope

- generar cliente frontend
- documentar inventario visual, kardex, SIAT, pagos o cuentas por pagar
- redisenar OpenAPI completo
- cambiar contratos de dominio salvo que una prueba demuestre inconsistencia real

## Acceptance Criteria

- OpenAPI lista exactamente los endpoints publicos existentes para `suppliers` y `purchases`.
- Los schemas de request y response coinciden con los contratos compartidos vigentes para paginacion, fechas puras, estados, items, recepcion y anulacion.
- Los errores documentados cubren validacion `400`, no autenticado `401`, prohibido `403`, no encontrado `404` y conflictos de dominio `409`.
- La documentacion mantiene explicito que `seller` no gestiona proveedores ni compras en este PRD.
- No se documentan endpoints publicos de inventario que todavia no existen.
- Si se detecta una divergencia entre OpenAPI y el codigo, el ticket la corrige o documenta como deuda explicita con ruta y motivo.
