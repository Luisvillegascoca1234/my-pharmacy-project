# Ticket 02 - Implement prepared invoice eligibility and creation service rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Implementar las reglas de elegibilidad y creacion de factura preparada desde una venta POS vigente. La factura debe conservar snapshot administrativo de la venta, generar correlativo interno `INV-000001` y no confundirse con comprobante POS ni emision SIAT.

## Scope

- Implementar `GET /billing/invoiceable-sales` con paginacion, filtros de fecha/vendedor/busqueda y banderas `canPrepareInvoice` / `invoiceBlockedReason`.
- Permitir preparar factura solo desde ventas `confirmed` no devueltas y sin factura activa `prepared`.
- Bloquear ventas inexistentes, anuladas, devueltas o con factura activa usando errores de dominio claros.
- Crear factura con `customerNit` default `0`, `customerBusinessName` default `Consumidor final`, `fiscalNotes` opcional y snapshot de venta/caja/vendedor/items.
- Generar correlativo interno propio con prefijo `INV-` y numeracion secuencial independiente de ventas.
- Guardar historial permitiendo nueva factura si las anteriores estan `cancelled`.
- Registrar auditoria de preparacion de factura con metadata suficiente para rastrear venta, correlativo, total y datos fiscales usados.

## Out Of Scope

- Cancelacion de factura preparada, salvo datos necesarios para no duplicar factura activa.
- Reglas de devolucion total y reposicion de stock.
- SIAT real, QR fiscal, CUIS, CUFD o emision fiscal en linea.
- UI para seleccionar ventas facturables.

## Acceptance Criteria

- Una venta confirmada vigente sin factura activa produce una factura `prepared` con items snapshot y total consistente.
- Una venta anulada devuelve bloqueo `sale-cancelled`.
- Una venta devuelta devuelve bloqueo `sale-returned`.
- Una venta con factura `prepared` devuelve bloqueo `active-invoice-exists`.
- Una venta con factura anterior `cancelled` puede generar una nueva factura `prepared`.
- La auditoria registra la accion de preparacion sin modificar venta, pago, caja ni inventario.
