# Ticket 02 - Add Suppliers Controllers Routes And Authorization

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 04

## Description

Exponer el modulo de proveedores por HTTP siguiendo el patron actual de `products` y `units`: rutas Express con `authenticateRequest`, autorizacion por rol, controllers livianos que validan contratos Zod compartidos y delegan reglas al service.

## Scope

- `backend/src/modules/suppliers/suppliers.controller.ts`
- `backend/src/modules/suppliers/suppliers.routes.ts`
- `backend/src/routes/index.ts`
- endpoints `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers` y `PATCH /api/suppliers/:id`
- validacion con `SuppliersQuerySchema`, `CreateSupplierSchema` y `UpdateSupplierSchema`
- autorizacion: lectura y gestion solo para `superadmin` y `admin`; `seller` no gestiona proveedores en este PRD

## Out Of Scope

- frontend de proveedores
- compras y formulario de compra
- endpoints de recepcion o anulacion
- permisos granulares nuevos fuera de roles base
- sincronizacion de filtros con query params en cliente

## Acceptance Criteria

- `suppliersRoutes` aplica `authenticateRequest` antes de cualquier handler.
- `GET /api/suppliers` valida query paginada compartida y responde con lista paginada, usando `page` 1-based, `pageSize` default 20 y maximo 100.
- `GET /api/suppliers/:id` responde el detalle de proveedor o `404` con codigo `SUPPLIER_NOT_FOUND`.
- `POST /api/suppliers` crea proveedor, responde `201`, pasa contexto de auditoria al service y bloquea usuarios fuera de `superadmin`/`admin`.
- `PATCH /api/suppliers/:id` actualiza datos y estado del proveedor, responde el proveedor actualizado y no permite borrado.
- Los controllers no importan Prisma ni contienen reglas de unicidad, historico o auditoria fuera del armado de contexto.
- `apiRoutes` registra `apiRoutes.use("/suppliers", suppliersRoutes)` sin alterar rutas existentes.
- Los errores siguen el formato `ApiError` usado por el backend actual.
