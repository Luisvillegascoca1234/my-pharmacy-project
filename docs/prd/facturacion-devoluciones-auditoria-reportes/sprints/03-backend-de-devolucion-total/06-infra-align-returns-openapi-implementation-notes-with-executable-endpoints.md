# Ticket 06 - Align returns OpenAPI implementation notes with executable endpoints

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 07

## Description

Alinear OpenAPI del bloque `returns` con endpoints ejecutables. El sprint 01 dejo contratos planificados; este ticket debe quitar lenguaje de "planned" donde corresponda y asegurar que request/response/error examples coincidan con el backend real de devolucion total.

## Scope

- Revisar `backend/src/docs/openapi.ts` para rutas `/returns/returnable-sales` y `/returns/sale-returns`.
- Mantener explicita la separacion entre anulacion POS y devolucion administrativa.
- Alinear codigos de error de bloqueo con `ReturnableSaleBlockReasonSchema`.
- Confirmar que schemas de `ReturnableSaleSummary`, `SaleReturn`, `SaleReturnItem` y requests compartidos coincidan con respuestas reales.
- Dejar notas de implementacion solo para reportes, CSV, auditoria consultable y UI cuando sigan siendo planificados.

## Out Of Scope

- Documentacion operativa de usuario.
- Tesis o evidencia academica.
- OpenAPI de reportes, CSV y auditoria consultable salvo referencias cruzadas necesarias.

## Acceptance Criteria

- OpenAPI ya no describe devoluciones totales como solo planificadas cuando el endpoint sea ejecutable.
- Los errores documentados incluyen venta no encontrada, venta anulada, ya devuelta, caja abierta, factura activa y pago no reembolsable.
- Los ejemplos no prometen devoluciones parciales ni modificacion de caja cerrada.
- El contrato documentado usa los mismos nombres de campos que `@pharmacy-pos/shared`.
