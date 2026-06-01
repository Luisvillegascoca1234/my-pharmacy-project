# Ticket 03 - Build Sale Detail And Cancellation Flow

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Construir la experiencia de detalle de venta y anulacion controlada. El vendedor debe consultar sus ventas recientes y anular una venta propia permitida con motivo; admin y superadmin deben poder anular ventas permitidas de cualquier vendedor cuando la caja asociada siga abierta.

## Scope

- Listado o acceso a ventas recientes segun rol.
- Detalle de venta con correlativo, vendedor, caja, fecha, estado, items, pago, cambio y consumos de lote cuando esten disponibles.
- Indicador claro de si la venta es anulable.
- Formulario de anulacion con motivo obligatorio.
- Confirmacion previa para anulaciones.
- Resultado posterior a anulacion con venta marcada como anulada y caja recalculada por backend.
- Errores para caja cerrada, venta ya anulada, motivo faltante, acceso denegado y venta no encontrada.

## Out Of Scope

- Anular ventas de cajas cerradas.
- Devoluciones despues del cierre de caja.
- Factura fiscal, notas de credito o bloqueo SIAT real.
- Reimpresion fiscal.
- Edicion de ventas confirmadas.
- Cambios manuales de inventario desde el detalle.

## Acceptance Criteria

- Un vendedor puede ver ventas propias recientes o abrir el detalle de una venta propia.
- Admin y superadmin pueden consultar ventas de todos con filtros basicos.
- El detalle muestra informacion suficiente para auditoria operativa de mostrador.
- La accion de anulacion exige motivo antes de enviar.
- Una venta de caja cerrada o ya anulada se muestra como no anulable.
- Una anulacion exitosa actualiza estado, oculta acciones no permitidas y muestra evidencia de motivo/usuario/fecha si la respuesta lo expone.
- Los errores conocidos no limpian el detalle ni hacen creer que la anulacion fue exitosa.
