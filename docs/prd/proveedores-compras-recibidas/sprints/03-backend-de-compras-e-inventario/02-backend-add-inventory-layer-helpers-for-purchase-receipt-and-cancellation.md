# Ticket 02 - Add Inventory Layer Helpers For Purchase Receipt And Cancellation

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Crear helpers internos de inventario para que compras pueda generar y revertir capas `InventoryBatch` y movimientos `InventoryMovement` sin mezclar reglas de inventario dentro de controllers o consultas sueltas. Estos helpers deben operar con un cliente transaccional recibido desde el service de compras.

## Scope

- `backend/src/modules/inventory/inventory.repository.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `backend/src/modules/inventory/inventory.types.ts`
- creacion de capas por item inventariable recibido
- movimientos `purchase_received` con cantidad positiva
- validacion y reversa de capas intactas para anulacion
- movimientos `purchase_cancelled` con cantidad negativa
- uso de `Prisma.TransactionClient` desde el flujo de compras

## Out Of Scope

- endpoints publicos de inventario
- pantalla de stock, kardex visual o agrupacion operativa por lote fisico
- FEFO de ventas o consumo de capas por POS
- ajustes manuales de inventario
- reglas fiscales o financieras

## Acceptance Criteria

- El modulo `inventory` no expone routes/controller nuevos en este sprint.
- Los helpers reciben una transaccion Prisma y no abren transacciones anidadas propias.
- La recepcion crea exactamente una capa `InventoryBatch` por `PurchaseItem` inventariable.
- La capa guarda `purchaseItemId`, `productId`, `originalQuantity`, `availableQuantity`, `baseUnitCost`, `batchNumber`, `expirationDate` y `status = active`.
- Cada capa creada genera un movimiento `purchase_received` con `quantityBase` positiva, `unitCostBase`, `referenceType = "purchase"`, `referenceId`, `referenceItemId`, `actorUserId` y `reason = "Purchase received"`.
- Los items no inventariables no crean capa ni movimiento.
- La anulacion valida que cada capa creada por la compra conserve `availableQuantity = originalQuantity` y `status = active`.
- Si alguna capa fue consumida, anulada o no coincide con su item, el helper bloquea la reversa con error de dominio.
- La reversa crea movimientos `purchase_cancelled` con cantidad negativa y deja las capas en `availableQuantity = 0` y `status = cancelled`.
- `InventoryMovement.productId` siempre coincide con la capa afectada.
