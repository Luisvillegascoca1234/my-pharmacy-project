# Ticket 03 - Build total sale returns page with returnable sales detail and reason modal

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Construir la pantalla administrativa de devoluciones totales. La UI debe diferenciar devolucion posterior al cierre de caja de anulacion POS, mostrar bloqueos esperados y registrar devolucion total con motivo.

## Scope

- Crear una pagina en `frontend/src/pages` para devoluciones administrativas.
- Mostrar ventas devolvibles con filtros de busqueda, vendedor y rango de fechas.
- Exponer bloqueos de devolucion: venta anulada, ya devuelta, caja abierta, factura preparada activa y pago no reembolsable.
- Permitir registrar devolucion total con motivo obligatorio de 5 a 500 caracteres.
- Mostrar listado de devoluciones registradas con filtros por venta, actor, busqueda y fechas.
- Abrir detalle de devolucion con venta, pago, actor, importe devuelto, motivo e items/lotes restaurados.
- Mostrar el importe devuelto como total neto de venta y evitar campos de reembolso manual V1.
- Mantener estados de carga, vacio, error y exito para la operacion administrativa.

## Out Of Scope

- Devoluciones parciales.
- Reapertura o modificacion de caja cerrada.
- Cancelacion de factura desde la pantalla de devoluciones, salvo mensaje que indique hacerlo en facturas.
- Reportes, exportaciones y auditoria consultable.

## Acceptance Criteria

- `admin` y `superadmin` pueden operar devoluciones; `seller` queda fuera.
- La pantalla explica con copy operativo cuando corresponde anulacion POS y no devolucion.
- Registrar devolucion total actualiza venta a devuelta en la informacion visible y agrega historial.
- Una factura activa bloquea devolucion con mensaje claro para cancelar primero la factura preparada.
- El detalle conserva trazabilidad por lote restaurado y movimiento cuando el backend lo entregue.
- La pagina consume hooks/facades del modulo, no APIs directas.
