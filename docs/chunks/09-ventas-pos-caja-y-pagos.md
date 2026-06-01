# 09 - Ventas POS, caja y pagos

## Objetivo

Construir el flujo operativo de mostrador para farmacia: abrir caja, buscar productos vendibles, cobrar en efectivo, descontar inventario por FEFO, emitir comprobante interno y cerrar caja con diferencia calculada.

## Alcance operativo

- Apertura y cierre de caja simple por usuario.
- Cierre de caja ajena por admin o superadmin.
- Busqueda de productos activos con stock vendible.
- Carrito POS con cantidades enteras.
- Venta anonima o consumidor final.
- Pago unico en efectivo.
- Registro de monto recibido y cambio.
- Descuento automatico de lotes por FEFO.
- Advertencia por productos proximos a vencer.
- Comprobante interno de venta.
- Carritos pendientes sin reserva de stock ni precio congelado.
- Anulacion controlada de ventas mientras la caja asociada siga abierta.
- Supervision administrativa de cajas, ventas y pendientes.

## Flujo del vendedor

1. Abrir caja propia con monto inicial cero o mayor.
2. Buscar productos por nombre comercial, principio activo, codigo interno o codigo de barras.
3. Agregar productos al carrito y ajustar cantidades enteras.
4. Revisar advertencias de proximo vencimiento cuando aparezcan.
5. Cobrar en efectivo registrando el monto recibido.
6. Entregar el cambio calculado.
7. Revisar el comprobante interno de la venta.
8. Cerrar caja al final del turno con el monto contado final.

El vendedor puede preparar o retomar una atencion sin caja abierta, pero no puede confirmar el cobro sin una caja propia abierta.

## Reglas de caja

- El monto inicial puede ser cero o mayor.
- No se aceptan montos negativos.
- Un usuario no debe tener dos cajas abiertas al mismo tiempo.
- El esperado de caja se calcula con monto inicial mas ventas efectivas netas.
- El cierre permite diferencia positiva, negativa o cero.
- La nota de cierre es opcional y sirve para explicar diferencias.
- Admin y superadmin pueden cerrar caja ajena.
- Una caja cerrada no se reabre en V1.

## Reglas de venta y pago

- La venta se crea recien al confirmar el pago.
- El carrito no descuenta inventario.
- El pago V1 es solo efectivo.
- El monto recibido debe cubrir el total de venta.
- El cambio se calcula automaticamente.
- La caja suma el total de venta, no el efectivo bruto recibido.
- El precio se toma del precio vigente del producto.
- No hay descuentos, promociones, pagos mixtos ni credito en V1.
- No se exige cliente, NIT ni razon social.
- Solo se aceptan cantidades enteras.

## FEFO y vencimientos

FEFO es la regla farmaceutica de salida que consume primero el lote vigente con vencimiento mas cercano.

- El vendedor no elige lote manualmente.
- Los lotes vencidos, bloqueados, cancelados o agotados no cuentan como vendibles.
- Si un lote no alcanza, la venta puede consumir varios lotes en orden FEFO.
- Si el stock total vendible no alcanza, se rechaza toda la venta.
- Los productos proximos a vencer pueden venderse con advertencia mientras sigan vigentes.
- La venta conserva evidencia de lote, vencimiento, cantidad y costo para trazabilidad y margen.

## Carritos pendientes

Un carrito pendiente es una atencion pausada, no una venta.

- No reserva stock.
- No congela precio.
- Expira a los 3 dias.
- Al retomarlo se revalidan precio, stock y estado de producto.
- Si el precio cambio, se informa y se cobra el precio vigente.
- Si el stock ya no alcanza, el carrito debe corregirse antes de cobrar.
- El vendedor opera sus propios pendientes.
- Admin y superadmin pueden revisar y descartar pendientes de todos.

## Anulacion y supervision

La anulacion V1 es una correccion operativa mientras la caja asociada sigue abierta.

- Toda anulacion requiere motivo.
- El vendedor anula solo ventas propias permitidas del dia.
- Admin y superadmin pueden anular ventas permitidas de cualquier vendedor.
- No se anulan ventas de cajas cerradas.
- La venta anulada no se borra.
- El pago queda con evidencia de reversa.
- El inventario se repone a los mismos lotes consumidos.
- La caja refleja ventas efectivas netas.

El correctivo backend reconcilia pendientes, anulacion de ventas y listados administrativos de supervision como flujo operativo V1. La deuda residual ya no es ausencia de disponibilidad para estas reglas, sino completar el guardrail final de cierre y documentar cualquier diferencia funcional que aparezca en una validacion posterior.

## Comprobante interno y factura fiscal

El comprobante interno documenta la venta POS, el vendedor, la caja, los productos, el monto recibido, el cambio y el consumo FEFO. Sirve para atencion, consulta y auditoria interna.

La factura fiscal es un documento tributario separado. En V1 no hay SIAT real, QR fiscal ni emision fiscal en linea. El comprobante interno no reemplaza factura fiscal.

## Fuera de alcance V1

- SIAT real.
- QR real.
- Tarjeta.
- Pagos mixtos.
- Credito o cuentas por cobrar.
- Cliente formal con NIT o razon social.
- Descuentos y promociones.
- Cantidades decimales.
- Reapertura de caja cerrada.
- Devoluciones posteriores al cierre.
- Reportes analiticos completos.
