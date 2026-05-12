# Ticket 03 - Cover Purchase Receipt Cancellation And Inventory Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 06

## Description

Agregar pruebas para los workflows transaccionales de recepcion y anulacion de compras, incluyendo la coordinacion con `inventory`. La cobertura debe demostrar que las capas `InventoryBatch`, movimientos `InventoryMovement`, estados de compra y auditoria se producen o revierten de forma atomica segun las reglas del PRD.

## Scope

- `backend/src/modules/purchases/purchases.service.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- tests backend de recepcion, anulacion de `draft` y anulacion de `received`
- fakes de repository transaccional para compras e inventario
- movimientos `purchase_received` y `purchase_cancelled`
- auditoria `PURCHASE_RECEIVED` y `PURCHASE_CANCELLED`

## Out Of Scope

- consumo FEFO por ventas
- pantalla de stock, kardex visual o inventario publico
- endpoints HTTP adicionales
- migraciones o cambios de modelos no justificados por fallas de prueba
- frontend de recepcion/anulacion

## Acceptance Criteria

- Una compra `draft` valida y sin items invalidos puede recibirse dentro de una transaccion.
- Cada item inventariable recibido crea exactamente una capa y un movimiento `purchase_received` con cantidad positiva, costo base y referencias correctas.
- Items no inventariables no crean capas ni movimientos de inventario.
- Recepcion rechaza compras no `draft`, proveedor inactivo, usuario receptor invalido, producto inactivo, lote/vencimiento faltante o vencimiento no valido.
- Anulacion de `draft` exige `cancelReason`, cambia estado y registra auditoria sin crear movimientos.
- Anulacion de `received` intacta crea movimientos `purchase_cancelled` negativos, deja capas en `cancelled` con `availableQuantity = 0` y registra auditoria.
- Anulacion de `received` consumida se bloquea sin cambios parciales.
- Los tests comprueban que `InventoryMovement.productId` coincide con la capa afectada.
