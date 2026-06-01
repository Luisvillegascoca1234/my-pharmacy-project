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

## Estado aprobado V1

El flujo de mostrador aprobado incluye pendientes POS, anulacion de ventas y supervision administrativa como capacidades operativas. El vendedor puede pausar atenciones con carritos pendientes propios, anular ventas propias permitidas mientras su caja siga abierta y cerrar su turno; admin y superadmin pueden revisar operaciones, descartar pendientes permitidos, anular ventas habilitadas por regla y cerrar caja ajena.

## Flujo del vendedor

1. Abrir caja propia con monto inicial cero o mayor.
2. Buscar productos por nombre comercial, principio activo, codigo interno o codigo de barras.
3. Agregar productos al carrito y ajustar cantidades enteras.
4. Revisar advertencias de proximo vencimiento cuando aparezcan.
5. Guardar un carrito pendiente si la atencion debe pausarse.
6. Retomar pendientes propios y corregirlos si cambio precio, stock o estado del producto.
7. Cobrar en efectivo registrando el monto recibido.
8. Entregar el cambio calculado.
9. Revisar el comprobante interno de la venta.
10. Anular ventas propias permitidas del dia, con motivo, mientras la caja asociada siga abierta.
11. Cerrar caja al final del turno con el monto contado final.

El vendedor puede preparar o retomar una atencion sin caja abierta, pero no puede confirmar el cobro sin una caja propia abierta.

## Flujo administrativo

Admin y superadmin supervisan la operacion de mostrador sin cambiar las reglas comerciales del vendedor.

- Revisan cajas abiertas, cajas cerradas, diferencias y responsable de apertura o cierre.
- Pueden cerrar caja ajena ingresando monto contado final y nota opcional.
- Revisan ventas de vendedores, incluyendo estado, comprobante interno, caja asociada y elegibilidad de anulacion.
- Pueden anular ventas permitidas de cualquier vendedor mientras la caja asociada siga abierta y exista motivo.
- Revisan carritos pendientes de todos los vendedores y descartan los que correspondan.
- No reasignan pendientes, no reabren cajas cerradas y no convierten el comprobante interno en factura fiscal.

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

## Reglas transversales

- Toda operacion de caja, venta, pendiente y anulacion conserva trazabilidad de usuario, fecha y estado.
- Las salidas y reposiciones de inventario mantienen lote, vencimiento y cantidad para auditoria farmaceutica.
- El efectivo esperado de caja se calcula con ventas efectivas netas: las anulaciones autorizadas reducen el esperado.
- La supervision administrativa no habilita pagos mixtos, credito, tarjeta, QR real, factura fiscal ni reapertura de caja cerrada.
- Las diferencias de caja se registran al cierre; no bloquean el cierre del turno.

## Comprobante interno y factura fiscal

El comprobante interno documenta la venta POS, el vendedor, la caja, los productos, el monto recibido, el cambio y el consumo FEFO. Sirve para atencion, consulta y auditoria interna.

La factura fiscal es un documento tributario separado. En V1 no hay SIAT real, QR fiscal ni emision fiscal en linea. El comprobante interno no reemplaza factura fiscal ni debe presentarse como documento tributario.

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
