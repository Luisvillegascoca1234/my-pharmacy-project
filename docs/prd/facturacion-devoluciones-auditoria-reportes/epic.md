# Epic - Facturacion, Devoluciones, Auditoria y Reportes

- PRD: ./PRD.md
- Status: DONE
- Slug: facturacion-devoluciones-auditoria-reportes

## Goal

Cerrar el ciclo administrativo posterior a ventas POS con factura preparada separada de venta, devolucion total controlada, auditoria consultable, reportes operativos iniciales y exportaciones CSV.

## Expected Result

Al cierre administrativo V1, un usuario `admin` o `superadmin` puede:

- Preparar una factura interna desde una venta vigente elegible.
- Cancelar una factura preparada con motivo.
- Registrar una devolucion total administrativa sobre una venta permitida.
- Ver reportes de ventas diarias, valuacion de inventario y productos proximos a vencer.
- Descargar CSV de ventas y movimientos de inventario.

Un usuario `superadmin` puede:

- Consultar auditoria paginada con metadata completa.

Un usuario `seller` no puede:

- Crear o cancelar facturas.
- Registrar devoluciones.
- Ver auditoria, reportes administrativos ni exportaciones.

## Product Scope

- Factura preparada con correlativo propio, datos fiscales minimos, snapshot de venta y estados `prepared` / `cancelled`.
- Generacion de factura solo desde ventas confirmadas vigentes.
- Cancelacion de factura con motivo obligatorio.
- Historial de facturas canceladas y maximo una factura activa por venta.
- Devolucion total, no parcial.
- Devolucion bloqueada por venta anulada, ya devuelta, caja abierta anulable o factura activa.
- Devolucion permitida sobre venta con factura cancelada.
- Venta devuelta marcada como `returned`.
- Pago devuelto marcado como `refunded`.
- Reposicion de inventario a los lotes originales.
- Movimiento de inventario `sale_returned`.
- Snapshot de devolucion por item/lote.
- Auditoria consultable solo por `superadmin`.
- Reporte de ventas diarias con bruto, anulaciones, devoluciones y neto.
- Reporte de valuacion con agregado por producto y detalle por lote.
- Reporte de productos proximos a vencer con parametro `days`.
- CSV de ventas con una fila por venta.
- CSV de movimientos con una fila por movimiento.
- Separador CSV punto y coma.
- Auditoria al descargar CSV.
- Pantallas administrativas para facturas, devoluciones, reportes, exportaciones y auditoria.
- Navegacion de devoluciones para `admin` y `superadmin`.

## Technical Scope

- Estados nuevos para venta devuelta, pago devuelto y movimiento por devolucion.
- Persistencia destructiva permitida para este alcance por ausencia de usuarios activos.
- Contratos compartidos para facturas, devoluciones, auditoria, reportes y exportaciones.
- Operaciones transaccionales para devolucion total.
- Reglas de elegibilidad de facturacion y devolucion centralizadas en servicios de dominio.
- Permisos por rol para facturacion, devoluciones, reportes, exportaciones y auditoria.
- Filtros, paginacion y ordenamiento descendente en listados administrativos.
- Fechas de reportes interpretadas con corte operativo de `America/La_Paz`.
- OpenAPI actualizado para endpoints nuevos.
- Modulos frontend de datos consumidos desde paginas mediante hooks/facades, sin UI dentro de modulos portables.

## Sprint Plan

1. Persistencia, estados y contratos: agregar estados y entidades de factura/devolucion, contratos compartidos, migracion destructiva permitida y primeras definiciones OpenAPI.
2. Backend de facturacion preparada: crear/listar facturas, generar desde venta elegible, cancelar con motivo, permisos, auditoria y bloqueos.
3. Backend de devolucion total: registrar devolucion total, bloquear casos invalidos, reponer lotes, crear movimientos, marcar pago/venta y auditar.
4. Backend de auditoria, reportes y CSV: exponer auditoria consultable, reportes iniciales y exportaciones con filtros y auditoria de descarga.
5. UI de facturas y devoluciones: listar, filtrar, preparar factura, cancelar factura, buscar ventas devolvibles y registrar devolucion total.
6. UI de reportes, exportaciones y auditoria: integrar pantallas administrativas, controles de rango, descarga CSV y metadata colapsable.
7. Cierre documental e infraestructura: reconciliar OpenAPI, documentacion operativa, evidencia academica y referencias de planificacion.

## Sprint Evidence

- Sprint 01 - Persistencia, estados y contratos: completado. Dejo la base destructiva permitida, estados administrativos, contratos compartidos y OpenAPI inicial.
- Sprint 02 - Backend de facturacion preparada: completado. Dejo facturas preparadas internas ejecutables, cancelacion con motivo, permisos, auditoria y bloqueos de elegibilidad.
- Sprint 03 - Backend de devolucion total: completado. Dejo devolucion administrativa total ejecutable, reposicion por lote, venta `returned`, pago `refunded`, movimiento `sale_returned` y auditoria.
- Sprint 04 - Backend de auditoria, reportes y CSV: completado. Dejo auditoria consultable, reportes operativos iniciales y exportaciones CSV con separador punto y coma y auditoria de descarga.
- Sprint 05 - UI de facturas y devoluciones: completado. Dejo superficies administrativas para preparar/cancelar facturas, registrar devoluciones totales y operar errores esperados.
- Sprint 06 - UI de reportes, exportaciones y auditoria: completado. Dejo superficies de analisis para reportes, descargas CSV y auditoria consultable con permisos por rol.
- Sprint 07 - Cierre documental e infraestructura: completado. Reconciliacion documental, evidencia academica, OpenAPI, limpieza y guardrails finales cierran el epic.

## Administrative Closure V1 Evidence

El alcance disponible se trata como cierre administrativo V1 entregado: factura preparada interna separada de venta, devolucion administrativa total posterior al cierre, trazabilidad por lote, venta devuelta, pago reembolsado, auditoria consultable, reportes operativos y exportaciones CSV regionales.

Las limitaciones V1 permanecen explicitas y no son deuda accidental de cierre: sin SIAT real, sin QR fiscal, sin devoluciones parciales, sin reapertura de caja cerrada, sin modificacion de cierres historicos, sin BI avanzado y sin CSV por item vendido.

El ticket final de guardrails valido documentacion, contratos publicados, tesis y referencias de planificacion; por tanto el epic queda cerrado como `DONE`.

## Ticket Category Hints

- `INFRA`: migraciones destructivas permitidas, contratos compartidos, estados nuevos, OpenAPI, documentacion operativa, evidencia de tesis y limpieza de referencias.
- `BACKEND`: facturacion preparada, devolucion total, auditoria consultable, reportes, exportaciones CSV, permisos, transacciones y pruebas de dominio.
- `UI`: paginas administrativas, navegacion, hooks/facades/stores de datos, filtros, modales de motivo, estados de error y descarga CSV.

## Dependencies

- Flujo POS con ventas confirmadas, pagos, items y consumos por lote.
- Anulacion POS ya implementada para cajas abiertas.
- Inventario por lote con movimientos y costo base.
- Auditoria escrita por flujos sensibles.
- Roles base `seller`, `admin` y `superadmin`.
- Contratos compartidos existentes para ventas, caja e inventario.

## Out of Scope

- SIAT real.
- QR fiscal.
- Emision fiscal en linea.
- Renovacion automatica CUIS/CUFD.
- Notas fiscales complejas.
- Devoluciones parciales.
- Reapertura de caja cerrada.
- Modificacion de cierres historicos de caja por devolucion.
- Reportes BI completos o data warehouse.
- Archivo CSV por item vendido.
- QA manual salvo solicitud explicita.

## Notes for create-epic-sprint

- No volver a entrevistar: las decisiones del grill-me ya cierran el alcance V1.
- Dividir el trabajo por sprints; no intentar implementar todo en un unico ticket.
- Priorizar persistencia y contratos antes de UI.
- Tratar migracion destructiva como permitida en este epic.
- Mantener factura preparada separada de venta y sin SIAT real.
- Mantener devolucion administrativa separada de anulacion POS.
- Bloquear devolucion si corresponde anulacion por caja abierta.
- Bloquear devolucion si existe factura preparada activa.
- Registrar devolucion total solamente; no planificar devoluciones parciales.
- Incluir pruebas automatizadas de backend como parte del trabajo de dominio.
- No planificar QA manual salvo que el usuario lo pida.

## Documentation and Thesis Impact

Este epic si requiere sprint final de documentacion y tesis. La razon es que cierra el ciclo administrativo del caso farmaceutico: diferencia entre comprobante interno y factura preparada, devolucion posterior al cierre, trazabilidad por lote, auditoria consultable, ventas netas, valuacion de inventario y exportacion de datos.

La documentacion operativa afectada debe explicar como preparar y cancelar facturas, cuando usar anulacion POS frente a devolucion administrativa, como interpretar ventas devueltas, como leer reportes y como descargar CSV. No debe describir estructura de codigo.

La tesis puede incorporar evidencia sobre control administrativo posterior a venta, trazabilidad farmaceutica por lote, separacion fiscal preparada sin SIAT real, reportes de gestion y auditoria de acciones sensibles.
