# PRD: Ventas POS, Caja y Pagos

## Resumen

Implementar el flujo operativo de mostrador para una farmacia: apertura de caja, POS rapido, venta pagada en efectivo, descuento de inventario por FEFO, movimientos de salida, margen por lote, comprobante interno, carritos pendientes, anulacion controlada y cierre de caja.

Documentos completos:

- PRD: `docs/prd/ventas-pos-caja-y-pagos/PRD.md`
- Epic: `docs/prd/ventas-pos-caja-y-pagos/epic.md`
- Decisiones: `docs/prd/ventas-pos-caja-y-pagos/decisions.md`
- Flujo operativo farmaceutico: `docs/prd/ventas-pos-caja-y-pagos/flujo-operativo-farmaceutico.md`

## Problema

La farmacia necesita vender productos disponibles sin perder trazabilidad de inventario, caja y pagos. Una venta debe consumir lotes por FEFO, generar movimientos, calcular margen real, registrar pago efectivo y quedar asociada a la caja del vendedor. Ademas, el mostrador necesita pausar atenciones con carritos pendientes y corregir errores con anulacion mientras la caja siga abierta.

## Solucion

Crear el flujo V1 de POS y caja. El vendedor abre caja, busca productos activos con stock vendible, arma carrito, cobra en efectivo y el sistema crea la venta transaccionalmente. FEFO descuenta automaticamente los lotes correctos, se registra pago, se genera comprobante interno y caja acumula ventas netas. Admin/superadmin pueden supervisar, cerrar caja ajena y anular ventas permitidas.

## Estado operativo V1

El flujo operativo V1 cubre apertura de caja, caja actual, cierre de caja propia o ajena permitida, busqueda de productos vendibles, venta anonima con pago efectivo, comprobante interno, cambio calculado, descuento automatico por FEFO, detalle de venta, ciclo de carritos pendientes, anulacion controlada y supervision administrativa.

Carritos pendientes, anulacion de ventas y supervision se documentan como comportamiento aprobado del flujo de mostrador: pendientes sin reserva de stock ni precio congelado, anulacion con motivo mientras la caja asociada siga abierta y supervision administrativa para revisar operaciones, descartar pendientes permitidos y cerrar caja ajena.

Los limites V1 siguen vigentes: pago unico en efectivo, comprobante interno no fiscal, sin SIAT real, sin QR real, sin tarjeta, sin credito, sin pagos mixtos, sin devoluciones posteriores al cierre y sin reapertura de caja cerrada.

## Evidencia de cierre

La evidencia acumulada hasta Sprint 08 confirma que las brechas de API ejecutable para carritos pendientes, anulacion y supervision administrativa quedaron resueltas dentro del alcance V1 aprobado. El registro de cierre mantiene esas capacidades como parte del flujo operativo validado tecnicamente y no como deuda actual de integracion.

Con la reconciliacion documental y la limpieza final de referencias del Sprint 09 completadas, el epic queda cerrado como `DONE`. El cierre no suma SIAT, medios de pago ampliados, devoluciones posteriores al cierre, reportes avanzados ni nuevas reglas comerciales.

## Capacidades operativas aprobadas

- Estados operativos para caja, venta, pago y pendiente.
- Apertura/cierre de caja con correlativo global, esperado, contado y diferencia.
- Venta anonima con correlativo global y pago unico en efectivo.
- FEFO automatico con movimientos de salida y margen por costo real.
- Anulacion con motivo, reversa de inventario, pago revertido e impacto neto en caja mientras la caja asociada siga abierta.
- Carritos pendientes editables, sin reserva de stock, sin congelar precio, con expiracion a 3 dias y conversion a venta con revalidacion.
- POS con busqueda por texto/codigo, carrito, cobro, detalle de venta y supervision por rol.

## Testing

- Probar apertura/cierre de caja, cierre ajeno, diferencia y permisos.
- Probar venta con caja abierta y rechazo sin caja abierta.
- Probar pago efectivo, cambio y asociacion a caja.
- Probar FEFO con uno y varios lotes, stock insuficiente y exclusion de lotes no vendibles.
- Probar movimientos de salida, margen y referencias de venta.
- Probar anulacion con motivo, bloqueo por caja cerrada, reposicion de lotes y pago revertido.
- Probar carritos pendientes: guardado, edicion, expiracion, revalidacion y conversion a venta.

## Epic principal

`ventas-pos-caja-y-pagos`: entregar el flujo completo desde apertura de caja hasta venta POS, pago efectivo, FEFO, anulacion y cierre de caja.

## Fuera de alcance

- QR real, tarjeta, pagos mixtos y credito.
- Facturacion SIAT real.
- Cliente formal con NIT o razon social.
- Descuentos, promociones, impuestos visibles o cambio manual de precio.
- Devoluciones posteriores al cierre de caja.
- Reapertura de caja cerrada.
- Reserva de stock por carritos pendientes.
- Fraccionamiento o cantidades decimales.
