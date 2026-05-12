# Ticket 03 - Validar contratos rutas y OpenAPI de cierre

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Validar que los contratos compartidos, endpoints backend, rutas frontend y documentacion OpenAPI minima sigan alineados al PRD despues de los sprints de implementacion. Este ticket debe buscar divergencias de cierre: nombres de campos, estados, schemas Zod, rutas HTTP, DTOs paginados, permisos por rol y operaciones de recepcion/anulacion.

La revision debe partir de `packages/shared/src/schemas/supplier.schema.ts`, `packages/shared/src/schemas/purchase.schema.ts`, `backend/src/modules/suppliers`, `backend/src/modules/purchases`, `backend/src/modules/inventory` y `backend/src/docs/openapi.ts`. Si todo ya esta consistente, el ticket debe registrar esa evidencia en sus completion notes al cerrarse.

## Scope

- `packages/shared/src/schemas/supplier.schema.ts`
- `packages/shared/src/schemas/purchase.schema.ts`
- `packages/shared/src/schemas/pagination.schema.ts`
- `backend/src/modules/suppliers`
- `backend/src/modules/purchases`
- `backend/src/modules/inventory`
- `backend/src/routes`
- `backend/src/docs/openapi.ts`
- imports frontend desde `@pharmacy-pos/shared` usados por proveedores y compras

## Out Of Scope

- ampliar OpenAPI a documentacion exhaustiva fuera de los endpoints del PRD
- agregar endpoints nuevos no definidos por el epic
- cambiar modelos Prisma o migraciones salvo inconsistencia bloqueante contra el schema ya implementado
- pruebas de carga, performance o seguridad avanzada
- inventario visual, SIAT, pagos, POS o reportes

## Acceptance Criteria

- Los schemas compartidos cubren proveedores, compras, items, recepcion, anulacion y paginacion usados por frontend y backend sin duplicaciones divergentes.
- Los endpoints `GET/POST/PATCH /api/suppliers`, `GET/POST/PATCH /api/purchases`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel` coinciden con los contratos consumidos por el frontend.
- OpenAPI documenta de forma minima los endpoints y schemas nuevos del PRD, incluyendo estados `draft`, `received`, `cancelled`, recepcion y anulacion.
- Las rutas backend aplican autorizacion para `superadmin` y `admin`, y bloquean gestion para `seller`.
- Las respuestas paginadas mantienen `page`, `pageSize`, `total` y `totalPages` compatibles con los stores frontend.
- Cualquier divergencia no corregida queda documentada como deuda explicita con motivo y alcance.

## Completion Notes

- Validado contra codigo real que `packages/shared/src/schemas/supplier.schema.ts`, `purchase.schema.ts` y `pagination.schema.ts` centralizan los contratos consumidos por frontend y backend para proveedores, compras, items, recepcion, anulacion y metadatos paginados.
- Confirmado que `backend/src/modules/suppliers` usa `GET /`, `GET /:id`, `POST /` y `PATCH /:id` con `CreateSupplierSchema`, `UpdateSupplierSchema`, `SuppliersQuerySchema` y respuestas paginadas `{ data, pagination: { page, pageSize, total, totalPages } }`.
- Confirmado que `backend/src/modules/purchases` usa `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `POST /:id/receive` y `POST /:id/cancel` con `CreatePurchaseSchema`, `UpdatePurchaseSchema`, `ReceivePurchaseSchema`, `CancelPurchaseSchema` y `PurchasesQuerySchema`.
- Confirmado que `frontend/src/modules/suppliers/api/suppliers-api.ts` y `frontend/src/modules/purchases/api/purchases-api.ts` consumen las mismas rutas y tipos compartidos desde `@pharmacy-pos/shared`.
- Confirmado que `backend/src/modules/suppliers/suppliers.routes.ts` y `backend/src/modules/purchases/purchases.routes.ts` aplican `authenticateRequest` y `requireRole(["superadmin", "admin"])`, por lo que `seller` queda bloqueado por middleware.
- Confirmado que `backend/src/docs/openapi.ts` documenta proveedores, compras, `PurchaseStatus` con `draft`, `received`, `cancelled`, schemas de paginacion, recepcion y anulacion, y respuestas 401/403/404/409 donde corresponde.
- No quedaron divergencias abiertas ni deuda explicita para este ticket.
