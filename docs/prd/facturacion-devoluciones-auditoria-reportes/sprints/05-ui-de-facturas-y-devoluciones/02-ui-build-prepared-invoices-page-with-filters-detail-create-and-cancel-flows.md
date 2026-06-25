# Ticket 02 - Build prepared invoices page with filters detail create and cancel flows

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Construir la pantalla administrativa de facturas preparadas internas. La UI debe separar claramente factura preparada, comprobante interno POS y SIAT real, permitiendo preparar y cancelar documentos internos con motivo.

## Scope

- Crear una pagina en `frontend/src/pages` para `/invoices`.
- Mostrar ventas facturables con filtros de busqueda, vendedor y rango de fechas.
- Permitir preparar factura desde venta elegible con NIT, razon social y notas fiscales opcionales.
- Mostrar listado de facturas preparadas con filtros por estado, correlativo, venta, busqueda y fechas.
- Abrir detalle de factura con snapshot de venta, vendedor, caja, datos fiscales, total e items.
- Permitir cancelar factura `prepared` con motivo obligatorio de 5 a 500 caracteres.
- Mostrar errores esperados: venta no facturable, venta anulada, venta devuelta, factura activa, factura inexistente y factura ya cancelada.
- Mantener estados de carga, vacio y error sin bloquear otras secciones de la pagina.

## Out Of Scope

- SIAT real, QR fiscal, CUIS, CUFD o emision tributaria.
- Devoluciones administrativas.
- Reportes, exportaciones y auditoria consultable.
- QA manual de navegador.

## Acceptance Criteria

- `admin` y `superadmin` pueden operar la pagina; `seller` no recibe acciones operativas.
- La pantalla deja visible que la factura es preparada interna y no SIAT real.
- Preparar factura actualiza listados/detalle sin duplicar factura activa.
- Cancelar factura exige motivo y refleja estado `cancelled`.
- Los errores esperados se presentan con copy claro y accionable.
- La pagina consume hooks/facades del modulo, no APIs directas.
