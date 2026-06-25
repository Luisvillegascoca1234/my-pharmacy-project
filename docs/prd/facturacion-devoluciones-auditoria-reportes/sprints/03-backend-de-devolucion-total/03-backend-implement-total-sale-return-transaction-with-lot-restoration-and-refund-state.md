# Ticket 03 - Implement total sale return transaction with lot restoration and refund state

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Implementar la transaccion que registra una devolucion administrativa total. La operacion debe cambiar venta, pago, stock, movimientos, snapshot de devolucion y auditoria de forma atomica.

## Scope

- Implementar `POST /returns/sale-returns` con motivo de 5 a 500 caracteres.
- Marcar la venta como `returned` sin modificar ni reabrir caja cerrada.
- Marcar el pago asociado como `refunded` y registrar `refundAmount` igual al total neto de la venta.
- Restaurar stock disponible a los mismos lotes consumidos por la venta mediante `SaleItemBatch`.
- Crear movimientos de inventario `sale_returned` por lote restaurado, con `referenceType` y referencias coherentes a la venta/devolucion.
- Crear `SaleReturn` y `SaleReturnItem` con snapshot de producto, lote, cantidad, costo base, precio de reembolso y movimiento asociado.
- Ejecutar todo dentro de una transaccion explicita.
- Registrar auditoria de devolucion total con motivo, actor, venta, pago, lotes restaurados y total devuelto.

## Out Of Scope

- Devoluciones parciales.
- Impacto directo sobre sesiones de caja cerradas.
- Crear o cancelar facturas preparadas.
- Reportes, CSV y UI.

## Acceptance Criteria

- Una devolucion exitosa cambia venta a `returned` y pago a `refunded`.
- La devolucion no incrementa ni decrementa montos de la sesion de caja cerrada.
- Cada consumo original por lote genera restauracion de cantidad y movimiento `sale_returned`.
- `SaleReturnItem` conserva snapshot suficiente aunque despues cambien producto, lote o movimiento.
- Una segunda devolucion sobre la misma venta falla sin duplicar stock ni pagos.
- Si cualquier paso de la transaccion falla, no quedan cambios parciales en venta, pago, lotes, movimientos ni devolucion.
