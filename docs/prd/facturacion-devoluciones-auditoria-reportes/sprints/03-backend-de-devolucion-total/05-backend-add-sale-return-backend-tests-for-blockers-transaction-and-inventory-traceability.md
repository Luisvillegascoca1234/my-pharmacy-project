# Ticket 05 - Add sale return backend tests for blockers transaction and inventory traceability

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 07

## Description

Agregar pruebas automatizadas para reglas criticas de devolucion total. Las pruebas deben priorizar servicios con repositories falsos y cubrir invariantes de transaccion, permisos, inventario por lote y auditoria.

## Scope

- Pruebas de service para venta devolvible, venta anulada, venta ya devuelta, caja abierta, factura preparada activa, factura cancelada y pago no reembolsable.
- Pruebas de transaccion exitosa: venta `returned`, pago `refunded`, `refundAmount`, lote restaurado, movimiento `sale_returned`, `SaleReturnItem` y auditoria.
- Pruebas de doble devolucion bloqueada sin duplicar stock.
- Pruebas de motivo invalido desde schema compartido.
- Pruebas de permisos/rutas cuando sean utiles para validar bloqueo de `seller`.
- Pruebas de listado y detalle contra schemas compartidos.

## Out Of Scope

- Pruebas de reportes, CSV, auditoria consultable y UI.
- Pruebas de devoluciones parciales.
- QA manual de navegador.

## Acceptance Criteria

- Las pruebas fallan si una venta con caja abierta puede devolverse.
- Las pruebas fallan si una factura `prepared` no bloquea la devolucion.
- Las pruebas prueban que factura `cancelled` no bloquea por si sola.
- Las pruebas fallan si la devolucion no restaura los lotes originales.
- Las pruebas prueban atomicidad ante fallo simulado en movimiento o item de devolucion.
- Las pruebas prueban auditoria de devolucion total y bloqueo de `seller`.
