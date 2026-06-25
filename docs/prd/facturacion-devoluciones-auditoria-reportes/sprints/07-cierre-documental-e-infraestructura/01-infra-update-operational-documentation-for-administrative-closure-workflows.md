# Ticket 01 - Update operational documentation for administrative closure workflows

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Actualizar la documentacion operativa de farmacia para que el cierre administrativo V1 ya no aparezca como capacidad futura. La documentacion debe explicar de forma util para usuarios administrativos la diferencia entre comprobante interno, factura preparada sin SIAT real, anulacion POS, devolucion administrativa total, reportes, exportaciones CSV y auditoria.

## Scope

- Guia de facturacion preparada, remarcando que no emite factura fiscal real ni integra SIAT.
- Guia de devoluciones y anulaciones, diferenciando caja abierta, caja cerrada, factura activa y factura cancelada.
- Guia de reportes y exportaciones, incluyendo ventas netas, valuacion de inventario, productos proximos a vencer y CSV con separador punto y coma.
- Guia de roles y navegacion, reflejando permisos de `admin`, `superadmin` y bloqueo de `seller`.
- Glosario operativo cuando se requiera aclarar lote, FEFO, kardex, comprobante interno, devolucion administrativa, factura preparada y auditoria.

## Out Of Scope

- Describir estructura interna de codigo, carpetas, endpoints internos o detalles de implementacion.
- Presentar SIAT real, QR fiscal, CUF/CUFD funcional, devoluciones parciales o reapertura de caja como disponibles.
- Cambios de UI, backend, contratos o pruebas.
- QA manual o capturas de navegador.

## Acceptance Criteria

- La documentacion explica que factura preparada es documento interno separado de la venta y sin emision fiscal real.
- La documentacion indica que una devolucion administrativa total no reabre caja cerrada y repone los lotes originales cuando la regla lo permite.
- Los reportes distinguen ventas brutas, anulaciones, devoluciones y neto; la valuacion usa lote disponible y costo real.
- Las exportaciones CSV se describen como descargas auditadas con fechas ISO y separador punto y coma.
- La documentacion usa jerga farmaceutica clara y no menciona organizacion interna del codigo.
