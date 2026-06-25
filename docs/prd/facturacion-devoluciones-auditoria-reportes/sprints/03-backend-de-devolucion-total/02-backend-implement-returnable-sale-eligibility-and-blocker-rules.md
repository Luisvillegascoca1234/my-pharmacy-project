# Ticket 02 - Implement returnable sale eligibility and blocker rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Implementar las reglas que deciden si una venta puede entrar al flujo de devolucion administrativa total. La elegibilidad debe separar devolucion posterior al cierre de caja de anulacion POS con caja abierta.

## Scope

- Implementar `GET /returns/returnable-sales` con paginacion, filtros de fecha/vendedor/busqueda y banderas `canReturn` / `returnBlockedReason`.
- Bloquear venta inexistente, anulada, ya devuelta, con caja abierta anulable, con pago no reembolsable o con factura preparada activa.
- Permitir venta con factura `cancelled` si las demas reglas se cumplen.
- Tratar venta `confirmed` con pago `paid` y caja cerrada como candidata para devolucion total.
- Reutilizar la informacion de factura preparada activa del sprint 02 sin acoplar `returns` a reglas fiscales internas mas alla del bloqueo requerido.
- Emitir errores de dominio claros para el endpoint de creacion cuando la venta no sea devolvible.

## Out Of Scope

- Crear la devolucion y restaurar inventario.
- Calcular reportes netos o CSV.
- Pantalla de busqueda de ventas devolvibles.

## Acceptance Criteria

- Venta anulada devuelve bloqueo `sale-cancelled`.
- Venta ya devuelta devuelve bloqueo `already-returned`.
- Venta con caja abierta anulable devuelve bloqueo `cash-session-open`.
- Venta con factura `prepared` devuelve bloqueo `active-invoice-exists`.
- Venta con factura `cancelled`, caja cerrada y pago `paid` queda devolvible.
- Venta con pago distinto de `paid` devuelve bloqueo `payment-not-refundable`.
