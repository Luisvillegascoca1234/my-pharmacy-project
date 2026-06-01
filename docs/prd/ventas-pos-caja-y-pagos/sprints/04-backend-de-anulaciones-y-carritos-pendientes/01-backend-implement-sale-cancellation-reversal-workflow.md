# Ticket 01 - Implement Sale Cancellation Reversal Workflow

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05
- Blocks: 03, 04

## Description

Implementar la anulacion transaccional de ventas confirmadas mientras la caja asociada siga abierta. La anulacion debe exigir motivo, respetar permisos, reponer inventario a las mismas capas consumidas, generar movimientos inversos, revertir el pago y ajustar el esperado de caja.

## Scope

- Validacion de venta existente y estado confirmado.
- Validacion de caja asociada abierta.
- Permisos: vendedor solo sus ventas del dia; admin/superadmin ventas de cualquier vendedor.
- Motivo obligatorio de anulacion.
- Reposicion de cantidad a las capas originales consumidas.
- Movimiento de inventario inverso por cada consumo.
- Pago marcado como revertido o cancelado sin borrarse.
- Ajuste automatico del esperado de caja.
- Auditoria de anulacion.

## Out Of Scope

- Anulacion de ventas de cajas cerradas.
- Devoluciones posteriores al cierre.
- Reapertura de caja cerrada.
- Facturacion SIAT y bloqueo fiscal real.
- UI para seleccionar motivo.
- Egreso manual separado de caja.

## Acceptance Criteria

- Una venta confirmada puede anularse si la caja asociada esta abierta.
- Una venta ya cancelada no puede anularse de nuevo.
- Un vendedor solo anula ventas propias del dia y de caja abierta.
- Admin y superadmin pueden anular ventas de cualquier vendedor si la caja sigue abierta.
- Una venta de caja cerrada se rechaza.
- Cada consumo de lote se repone a la misma capa.
- Cada reposicion genera movimiento `sale_cancelled` con cantidad positiva.
- El pago original queda marcado como revertido/cancelado y conserva evidencia.
- El esperado de caja descuenta el total de la venta anulada.
- La venta queda en estado cancelado con motivo, usuario y fecha de anulacion.

## Historical Reconciliation

- Estado reconciliado durante Sprint 09: la anulacion transaccional quedo cubierta por el correctivo backend del Sprint 08, con motivo obligatorio, permisos por rol, caja abierta, pago revertido, reposicion por lote, movimientos inversos y caja neta.
