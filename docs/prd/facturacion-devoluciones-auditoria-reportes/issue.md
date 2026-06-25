# PRD: Facturacion, Devoluciones, Auditoria y Reportes

## Resumen

Cierre administrativo posterior a ventas POS: factura preparada separada de venta, devolucion total controlada, auditoria consultable, reportes operativos iniciales y exportaciones CSV.

Documentos completos:

- PRD: `docs/prd/facturacion-devoluciones-auditoria-reportes/PRD.md`
- Epic: `docs/prd/facturacion-devoluciones-auditoria-reportes/epic.md`
- Decisiones: `docs/prd/facturacion-devoluciones-auditoria-reportes/decisions.md`

## Problema

El POS cubre venta, pago, FEFO, anulacion con caja abierta y comprobante interno. El cierre administrativo V1 completa el ciclo posterior con documentos fiscales internos sin SIAT real, devoluciones posteriores al cierre sin modificar caja cerrada, auditoria consultable, reportes y exportacion de datos confiables.

## Solucion

Crear facturas preparadas con correlativo propio, estados `prepared` / `cancelled` y snapshot de venta. Registrar devoluciones totales administrativas solo para ventas permitidas, marcando venta `returned`, pago `refunded`, reponiendo lotes originales y generando movimientos `sale_returned`. Exponer auditoria para `superadmin`, reportes para `admin`/`superadmin` y CSV de ventas/movimientos con filtros.

## Implementacion

- Persistencia destructiva permitida porque no hay usuarios activos, aplicada como base del cierre administrativo V1.
- Contratos compartidos para facturas, devoluciones, auditoria, reportes y exportaciones, reconciliados con OpenAPI.
- Backend con reglas transaccionales para devolucion total, reposicion por lote, venta `returned`, pago `refunded` y movimiento `sale_returned`.
- Facturacion preparada separada de ventas y sin SIAT real, disponible como documento interno administrativo.
- Reportes iniciales disponibles: ventas diarias, valuacion de inventario y proximos vencimientos.
- Exportaciones CSV disponibles con separador punto y coma y auditoria de descarga.
- UI administrativa disponible para facturas, devoluciones, reportes, exportaciones y auditoria.
- Documentacion operativa y evidencia academica actualizadas para el cierre administrativo V1.

## Evidencia de Cierre V1

- Sprints 01 a 06 completados: persistencia/contratos, facturacion preparada, devolucion total, auditoria/reportes/CSV, UI de facturas/devoluciones y UI de reportes/exportaciones/auditoria.
- Sprint 07 completado como cierre documental e infraestructura: documentacion operativa, OpenAPI, tesis, reconciliacion de registros, limpieza y guardrails finales.
- Las capacidades disponibles se consideran parte del cierre administrativo V1 y no deuda futura: preparar/cancelar facturas internas, registrar devoluciones administrativas totales, consultar auditoria, revisar reportes y descargar CSV.
- Limitaciones V1 consistentes: sin SIAT real, sin QR fiscal, sin devoluciones parciales, sin reapertura de caja cerrada, sin impacto directo sobre cierres historicos, sin BI avanzado y sin CSV por item vendido separado.

## Testing

Incluir pruebas automatizadas de dominio para:

- Factura desde venta elegible.
- Bloqueos por venta anulada, devuelta o factura activa.
- Cancelacion de factura con motivo.
- Devolucion total, doble devolucion bloqueada y bloqueo si corresponde anulacion POS.
- Reposicion de lotes, venta `returned`, pago `refunded` y movimiento `sale_returned`.
- Reportes netos, valuacion por lote y vencimientos.
- CSV con filtros y auditoria de descarga.

No se planifica QA manual salvo solicitud explicita.

## Epic principal

`facturacion-devoluciones-auditoria-reportes`: cierre administrativo V1 con facturacion preparada, devoluciones totales, auditoria, reportes y exportaciones.

Estado administrativo: capacidades V1 entregadas por sprints 01 a 06 y cierre documental del sprint 07 completado; epic marcado como `DONE`.

## Fuera de alcance

- SIAT real.
- QR fiscal.
- Emision fiscal en linea.
- Devoluciones parciales.
- Reapertura de caja cerrada.
- Impacto directo de devoluciones sobre sesiones de caja cerradas.
- BI avanzado o data warehouse.
- CSV por item vendido separado.
- QA manual salvo solicitud explicita.
