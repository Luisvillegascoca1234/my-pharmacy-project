# Ticket 04 - Add Purchases Controllers Routes And Authorization

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 05

## Description

Exponer el modulo `purchases` por HTTP siguiendo el patron de `suppliers`: rutas Express autenticadas, autorizacion por rol, controllers livianos con validacion Zod compartida y delegacion completa al service. `superadmin` y `admin` pueden gestionar compras; `seller` queda fuera del alcance operativo del PRD.

## Scope

- `backend/src/modules/purchases/purchases.controller.ts`
- `backend/src/modules/purchases/purchases.routes.ts`
- `backend/src/routes/index.ts`
- endpoints `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `PATCH /api/purchases/:id`
- endpoints `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`
- validacion con `PurchasesQuerySchema`, `CreatePurchaseSchema`, `UpdatePurchaseSchema`, `ReceivePurchaseSchema` y `CancelPurchaseSchema`
- armado de contexto de auditoria desde request autenticado

## Out Of Scope

- OpenAPI detallado
- frontend, rutas cliente, formularios, stores Zustand o navegacion
- permisos granulares nuevos fuera de roles base
- SIAT, pagos, cuentas por pagar o documento fiscal
- endpoints publicos de inventario

## Acceptance Criteria

- `purchasesRoutes` aplica `authenticateRequest` antes de cualquier handler.
- Todas las rutas de compras bloquean usuarios fuera de `superadmin` y `admin`; `seller` recibe `403`.
- `GET /api/purchases` valida query paginada y responde lista compatible con `PurchasesListResponseSchema`.
- `GET /api/purchases/:id` responde detalle completo o `404` con codigo de error especifico.
- `POST /api/purchases` crea borrador, responde `201`, asigna `createdByUserId` desde el usuario autenticado y pasa contexto de auditoria.
- `PATCH /api/purchases/:id` reemplaza borrador completo y rechaza estados no editables mediante el service.
- `POST /api/purchases/:id/receive` valida `receiveNotes`, llama al workflow transaccional y devuelve la compra recibida.
- `POST /api/purchases/:id/cancel` valida `cancelReason`, llama al workflow correspondiente y devuelve la compra anulada.
- Los controllers no importan Prisma ni contienen reglas de conversion, inventario, estado o auditoria.
- `apiRoutes` registra `apiRoutes.use("/purchases", purchasesRoutes)` sin alterar rutas existentes.
