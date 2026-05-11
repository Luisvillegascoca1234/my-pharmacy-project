# Ticket 05 - Wire Purchases OpenAPI And Backend Integration

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Actualizar la documentacion OpenAPI minima y el wiring backend necesario para que el nuevo modulo de compras quede visible, tipado y coherente con los contratos compartidos. Este ticket tambien debe revisar que exports, imports y errores publicados no queden incompletos despues de conectar rutas y schemas.

## Scope

- `backend/src/docs/openapi.ts`
- `backend/src/routes/index.ts` si no fue completado en ticket 04
- exports o barrels backend necesarios para `purchases` e `inventory`
- codigos de error documentados para compras, recepcion y anulacion
- schemas OpenAPI de `Purchase`, `PurchaseItem`, queries, create/update, receive y cancel

## Out Of Scope

- implementacion funcional nueva fuera del wiring/documentacion
- UI o documentacion de usuario final
- documentacion completa de inventario visual, kardex, SIAT o pagos
- generacion de cliente frontend

## Acceptance Criteria

- OpenAPI documenta `GET /purchases`, `GET /purchases/{id}`, `POST /purchases`, `PATCH /purchases/{id}`, `POST /purchases/{id}/receive` y `POST /purchases/{id}/cancel`.
- Los schemas reflejan los contratos compartidos actuales, incluyendo fechas puras, items, proveedor, usuarios, estados y paginacion.
- Las respuestas de error esperadas cubren validacion `400`, no autenticado `401`, prohibido `403`, no encontrado `404`, conflicto de dominio `409` y errores de estado cuando apliquen.
- La documentacion indica que `seller` no gestiona compras en este PRD.
- No se documentan endpoints de inventario publicos que no existan.
- El wiring final permite montar `/api/purchases` sin romper `/api/suppliers`, `/api/products`, `/api/units`, `/api/auth` ni rutas existentes.
