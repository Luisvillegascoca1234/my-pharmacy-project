# Ticket 02 - Cover Purchases Draft And Validation Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 03, 06

## Description

Agregar pruebas del service de compras para listas, detalle, creacion de borradores y reemplazo transaccional de items mientras la compra siga en `draft`. La cobertura debe demostrar que el backend calcula snapshots y totales, valida proveedor activo, producto activo, unidad configurada y duplicados equivalentes sin depender de controllers HTTP.

## Scope

- `backend/src/modules/purchases/purchases.service.ts`
- tests backend para flujos `listPurchases`, `getPurchase`, `createPurchase` y `updatePurchase`
- fakes de `PurchasesRepository` y dependencias de productos/unidades/proveedores
- validaciones de cantidades, costos, fechas puras, `batchNumber` y duplicados
- auditoria `PURCHASE_CREATED` y `PURCHASE_UPDATED`

## Out Of Scope

- recepcion y anulacion de compras recibidas
- helpers internos de inventario
- controllers, routes o pruebas HTTP
- frontend de compras, formularios o stores Zustand
- cambios de persistencia no requeridos por los tests

## Acceptance Criteria

- `listPurchases` conserva filtros `search`, `status`, `supplierId`, `fromDate`, `toDate`, `page` y `pageSize`.
- `getPurchase` devuelve detalle completo o `404` con codigo especifico cuando no existe.
- `createPurchase` exige al menos un item, proveedor activo y usuario creador valido.
- `updatePurchase` rechaza compras que no esten en `draft` y reemplaza encabezado e items usando el flujo transaccional del repository.
- Cada item prueba snapshot de `conversionFactor`, `baseQuantity`, `baseUnitCost` y `lineTotal` con redondeo esperado.
- Productos inactivos, unidades no configuradas e items duplicados equivalentes generan errores de dominio verificables.
- `batchNumber` queda normalizado en uppercase y trim cuando aplica.
