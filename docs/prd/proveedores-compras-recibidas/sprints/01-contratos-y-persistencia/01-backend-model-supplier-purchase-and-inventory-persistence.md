# Ticket 01 - Model Supplier Purchase And Inventory Persistence

- Status: TODO
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 03

## Description

Modelar en Prisma la persistencia base para proveedores, compras, items de compra, capas internas de inventario y movimientos de inventario. El objetivo es dejar una estructura relacional consistente para que los siguientes sprints puedan implementar services transaccionales sin rediseñar tablas.

## Scope

- `backend/prisma/schema.prisma`
- enums `SupplierStatus`, `PurchaseStatus`, `InventoryBatchStatus` e `InventoryMovementType`
- modelos `Supplier`, `Purchase`, `PurchaseItem`, `InventoryBatch` e `InventoryMovement`
- relaciones con `User`, `Product`, `Unit` y `AuditLog` cuando corresponda
- indices para busqueda, filtros, relaciones y consultas futuras de inventario por producto, lote y vencimiento

## Out Of Scope

- controllers, routes, services y repositories de `suppliers`, `purchases` o `inventory`
- ejecucion de reglas de recepcion o anulacion
- pantallas frontend, stores Zustand o navegacion
- SIAT, `documentNumber`, pagos a proveedores, cuentas por pagar y kardex visual

## Acceptance Criteria

- `Supplier` soporta `businessName`, `nit` opcional, contacto, direccion, estado, timestamps y relacion historica con compras.
- La unicidad de NIT permite multiples proveedores sin NIT y evita duplicados cuando el NIT existe, usando la estrategia PostgreSQL/Prisma mas compatible con el repo.
- `Purchase` representa `draft`, `received` y `cancelled`, guarda proveedor, fecha comercial, total, usuarios de creacion/recepcion, notas, motivo de anulacion y timestamps de estado.
- `PurchaseItem` guarda producto, unidad comercial, cantidad, costo unitario, lote, vencimiento y snapshots `conversionFactor`, `baseQuantity`, `baseUnitCost` y `lineTotal`.
- `InventoryBatch` se modela como capa interna por recepcion, con cantidad original/disponible, costo base, lote, vencimiento, estado y referencia al item de compra que la genero.
- `InventoryMovement` referencia capa, producto, tipo, cantidades firmadas, costo base, referencia de origen, actor y motivo.
- Las relaciones e indices favorecen listas paginadas de proveedores/compras y consultas futuras por producto, lote, vencimiento y referencias de compra.
