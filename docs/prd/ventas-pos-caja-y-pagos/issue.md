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

## Estado de cierre V1

El flujo disponible para integracion operativa cubre apertura de caja, caja actual, cierre de caja por identificador, busqueda de productos vendibles, venta anonima con pago efectivo, comprobante interno, cambio calculado, descuento automatico por FEFO, detalle de venta, ciclo de carritos pendientes, anulacion controlada y listados paginados de supervision.

La deuda registrada en el cierre del Sprint 07 sobre rutas ausentes de pendientes, anulacion y supervision queda reconciliada por el correctivo backend. El guardrail correctivo de validacion tecnica fue ejecutado sin bloqueos externos; la deuda restante queda acotada a cualquier ajuste de experiencia que derive de pruebas funcionales posteriores.

Impacto: las superficies de caja, POS efectivo, comprobante interno, consumo FEFO, pendientes, anulacion y supervision ya tienen contrato operativo alineado para continuar el cierre del epic. Motivo: el correctivo incorpora los estados y errores de dominio necesarios para diferenciar pendiente expirado, venta no anulable, caja cerrada, acceso denegado y stock insuficiente.

## Implementacion

- Contratos compartidos para caja, venta, pago, anulacion, busqueda POS y carritos pendientes.
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
