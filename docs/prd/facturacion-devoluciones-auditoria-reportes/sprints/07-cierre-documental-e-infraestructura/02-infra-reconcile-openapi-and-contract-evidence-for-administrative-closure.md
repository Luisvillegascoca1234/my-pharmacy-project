# Ticket 02 - Reconcile OpenAPI and contract evidence for administrative closure

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Reconciliar la evidencia publicada de contratos y OpenAPI con el comportamiento final del epic. El objetivo es que las capacidades implementadas de facturacion preparada, devoluciones, auditoria, reportes y CSV queden descritas como contratos V1 ejecutables, con sus limites explicitos.

## Scope

- Resumen OpenAPI de facturacion preparada, devoluciones administrativas, auditoria, reportes y exportaciones.
- Descripciones de permisos por rol y errores esperados.
- Evidencia de que reportes visuales no auditan consulta y descargas CSV si generan auditoria.
- Estados `prepared`, `cancelled`, `returned`, `refunded` y movimiento `sale_returned`.
- Limitaciones V1: sin SIAT real, sin QR fiscal, sin devoluciones parciales, sin BI avanzado y sin CSV por item vendido.

## Out Of Scope

- Crear endpoints nuevos o cambiar contratos.
- Modificar calculos de reportes, columnas CSV o reglas de auditoria.
- Documentacion de usuario o tesis, salvo referencias de consistencia necesarias.
- QA manual.

## Acceptance Criteria

- OpenAPI no presenta facturacion preparada como emision SIAT real.
- Los contratos publicados reflejan roles correctos para facturas, devoluciones, auditoria, reportes y exportaciones.
- Los endpoints de reportes declaran `audited=false`; los endpoints CSV declaran descarga auditada.
- Los errores esperados de venta no facturable, factura activa, venta ya devuelta, permisos y filtros invalidos quedan nombrados de forma consistente.
- Cualquier brecha encontrada se registra como deuda explicita sin cambiar el alcance V1.

## Closure Notes

- Se reconcilio la evidencia OpenAPI publicada con los contratos ejecutables del cierre administrativo V1.
- La evidencia `x-contract-parity-review.administrativeClosureV1Evidence` documenta roles por superficie: facturacion preparada, devoluciones, reportes y CSV para `admin`/`superadmin`; auditoria consultable solo para `superadmin`.
- Facturacion preparada queda descrita como comprobante interno administrativo con estados `prepared` y `cancelled`, sin SIAT real, QR fiscal, XML, CUF, CUFD, envio tributario ni anulacion fiscal.
- Devolucion administrativa queda descrita como devolucion total con venta `returned`, pago `refunded` y movimiento `sale_returned`, separada de anulacion POS y sin devoluciones parciales.
- Reportes visuales mantienen contrato `audited=false` y sin efecto de auditoria; descargas CSV declaran `text/csv; charset=utf-8`, separador `;` y auditoria `CSV_EXPORT_DOWNLOADED`.
- Los errores esperados quedaron nombrados en la evidencia contractual: `SALE_NOT_INVOICEABLE`, `PREPARED_INVOICE_ACTIVE_EXISTS`, `SALE_NOT_RETURNABLE`, `SALE_PAYMENT_NOT_REFUNDABLE`, `SALE_RETURN_CONFLICT`, `FORBIDDEN`, `UNSUPPORTED_TIMEZONE`, `INVALID_REPORT_DATE_RANGE` e `INVALID_EXPORT_DATE_RANGE`.
- Deuda registrada: ninguna brecha adicional encontrada; las limitaciones V1 permanecen explicitas: sin SIAT real, sin QR fiscal, sin devoluciones parciales, sin BI avanzado y sin CSV por item vendido.
