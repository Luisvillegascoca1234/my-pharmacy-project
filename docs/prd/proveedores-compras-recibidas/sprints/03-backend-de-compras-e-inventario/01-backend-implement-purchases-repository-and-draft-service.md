# Ticket 01 - Implement Purchases Repository And Draft Service

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear la capa base de persistencia y negocio del modulo `purchases` para listar compras, consultar detalle, crear borradores y reemplazar encabezado e items mientras la compra siga en `draft`. El service debe aplicar las reglas de proveedor activo, producto activo, unidad configurada en `ProductUnit`, snapshots de conversion, cantidades normalizadas, total calculado en backend y rechazo de items duplicados equivalentes.

## Scope

- `backend/src/modules/purchases/purchases.repository.ts`
- `backend/src/modules/purchases/purchases.service.ts`
- `backend/src/modules/purchases/purchases.types.ts`
- lectura de `Supplier`, `Product`, `ProductUnit`, `Purchase` y `PurchaseItem` mediante repositories o consultas encapsuladas
- `GET` domain data para listas paginadas y detalle con proveedor, usuarios e items
- `POST / PATCH` service methods para compras en borrador, sin exponer HTTP todavia
- audit logs `PURCHASE_CREATED` y `PURCHASE_UPDATED` con `entityType = "purchase"`

## Out Of Scope

- controllers, routes y middleware HTTP
- recepcion de compras, capas `InventoryBatch` y movimientos `InventoryMovement`
- anulacion de compras
- OpenAPI
- frontend, stores Zustand, formularios o navegacion
- pagos, SIAT, cuentas por pagar o documento fiscal

## Acceptance Criteria

- `PurchasesRepository` encapsula Prisma para listas, detalle, creacion, reemplazo de items en transaccion, cambio de estado futuro y auditoria.
- `listPurchases` soporta `search`, `status`, `supplierId`, `fromDate`, `toDate`, `page` y `pageSize`, con respuesta compatible con `PurchasesListResponseSchema`.
- `getPurchase` devuelve proveedor, usuarios e items completos para `GET /api/purchases/:id` futuro, sin filtrar Prisma fuera del repository.
- `createPurchase` exige al menos un item, proveedor activo y `createdByUserId` valido desde contexto autenticado.
- `updatePurchase` devuelve `404` si no existe, rechaza cambios si el estado no es `draft` y reemplaza encabezado e items completos dentro de una transaccion.
- Cada item valida producto activo, unidad configurada para el producto y snapshot de `conversionFactor`, `baseQuantity`, `baseUnitCost` y `lineTotal`.
- `batchNumber` se normaliza con trim y uppercase para items inventariables; `expirationDate` se trata como fecha pura.
- El total de compra se calcula en backend desde `lineTotal` y usa escala de dinero de 2 decimales.
- Los items duplicados equivalentes se rechazan con error de dominio coherente.
- La auditoria de creacion y actualizacion recibe actor, IP y user agent cuando el controller los provea.
