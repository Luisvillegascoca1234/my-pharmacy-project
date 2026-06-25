# Ticket 05 - Align billing OpenAPI implementation notes with executable endpoints

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 06

## Description

Alinear la documentacion OpenAPI del bloque `billing` con endpoints ejecutables. El sprint 01 dejo contratos planificados; este ticket debe quitar lenguaje de "planned" donde corresponda y asegurar que request/response/error examples coincidan con el backend real de facturacion preparada.

## Scope

- Revisar `backend/src/docs/openapi.ts` para rutas `/billing/invoiceable-sales` y `/billing/prepared-invoices`.
- Mantener explicita la separacion entre factura preparada interna y SIAT real.
- Alinear codigos de error de elegibilidad y cancelacion con los errores de service/controller.
- Confirmar que schemas de `PreparedInvoice`, `InvoiceableSaleSummary` y requests compartidos coincidan con respuestas reales.
- Dejar notas de implementacion solo para devoluciones, reportes, CSV y auditoria consultable cuando sigan siendo planificados.

## Out Of Scope

- Documentacion operativa de usuario.
- Tesis o evidencia academica.
- OpenAPI de devoluciones, reportes, CSV y auditoria consultable salvo referencias cruzadas necesarias.

## Acceptance Criteria

- OpenAPI ya no describe facturacion preparada como solo planificada cuando el endpoint sea ejecutable.
- Los ejemplos y respuestas documentadas no prometen SIAT, QR fiscal ni emision tributaria real.
- Los errores documentados incluyen venta no elegible, factura activa, factura inexistente y factura ya cancelada.
- El contrato documentado usa los mismos nombres de campos que `@pharmacy-pos/shared`.
