# 10 - Facturacion, devoluciones, auditoria y reportes

## Objetivo

Cerrar el primer ciclo administrativo posterior a la venta POS: distinguir comprobante interno POS, factura preparada interna y factura fiscal real; permitir devoluciones administrativas totales; consultar auditoria; y generar reportes exportables.

## Alcance

- Factura preparada interna separada de la venta y del comprobante POS.
- Correlativo propio para la factura preparada.
- Cancelacion de factura preparada con motivo obligatorio.
- Devolucion administrativa total posterior al cierre de caja.
- Reposicion a los mismos lotes consumidos por la venta original.
- Venta devuelta y pago reembolsado como estados visibles del cierre administrativo.
- Auditoria consultable para operaciones sensibles.
- Reportes operativos iniciales de ventas diarias, valuacion de inventario y productos proximos a vencer.
- Exportacion CSV regional con separador punto y coma.

Reglas:

- El comprobante interno POS no es factura fiscal ni documento SIAT.
- La factura preparada no representa emision fiscal real, QR fiscal, CUF, CUFD ni respuesta SIAT.
- Solo `admin` y `superadmin` preparan o cancelan facturas preparadas.
- La devolucion administrativa aplica despues del cierre operativo y no reabre ni modifica cierres historicos de caja.
- Si la caja sigue abierta y la venta es anulable, corresponde anulacion POS, no devolucion administrativa.
- Si existe factura preparada activa, primero debe cancelarse antes de registrar devolucion.
- La devolucion V1 es total; no se permiten devoluciones parciales.
- Los reportes visuales no generan auditoria; las descargas CSV si registran auditoria.

## Superficies operativas

- Facturas preparadas por estado, detalle, preparacion desde ventas elegibles y cancelacion.
- Devoluciones administrativas totales, ventas devolvibles, motivo y detalle con lotes.
- Auditoria con filtros, paginacion y metadata para investigacion administrativa.
- Reportes de ventas diarias, valuacion de inventario por lote y proximos vencimientos.
- Exportaciones de ventas y movimientos de inventario en CSV.

## Verificacion

- Venta vigente elegible puede generar factura preparada.
- `admin` o `superadmin` puede cancelar una factura preparada con motivo.
- `seller` no puede operar facturas, devoluciones, reportes administrativos, exportaciones ni auditoria.
- Devolucion registra motivo, actor administrativo, venta original y lotes restaurados.
- Devolucion cambia la venta a devuelta, el pago a reembolsado y genera movimiento de retorno.
- Auditoria muestra eventos sensibles con metadata suficiente.
- Reporte de ventas diarias diferencia ventas brutas, anulaciones, devoluciones y neto.
- CSV de ventas y movimientos usa columnas estables, fechas ISO y separador punto y coma.

## Fuera de alcance

- Integracion SIAT real.
- QR fiscal.
- Emision fiscal en linea.
- Devoluciones parciales.
- Reapertura de caja cerrada.
- Data warehouse.
- BI externo.
- CSV por item vendido separado.
- Notas fiscales complejas fuera del alcance academico inicial.
