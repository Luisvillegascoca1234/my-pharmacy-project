# Decisions - Ventas POS, Caja y Pagos

## Caja

- La caja pertenece al usuario que la abre.
- Una caja esta abierta si existe una sesion `open` del usuario autenticado sin fecha de cierre.
- Un usuario no puede tener dos cajas abiertas al mismo tiempo.
- El vendedor debe tener caja abierta para cobrar ventas.
- El monto inicial puede ser `0` o mayor.
- No se aceptan montos negativos.
- El cierre pide solo monto contado final, sin desglose de billetes o monedas.
- Se puede cerrar caja aunque exista diferencia.
- La nota de cierre es opcional.
- Admin y superadmin pueden cerrar caja ajena.
- Si admin o superadmin cierra caja ajena, debe ingresar monto contado final.
- El cierre conserva quien abrio la caja y quien la cerro.
- Una caja cerrada no se reutiliza.
- No se permite anular ventas asociadas a una caja cerrada.
- Cada caja tendra correlativo global legible, recomendado `C-000001`.

## POS

- El POS sera una pantalla rapida de mostrador.
- El flujo principal muestra productos activos con stock disponible.
- Productos inactivos no aparecen en POS.
- Productos sin stock pueden mostrarse solo como filtro secundario, pero no se agregan al carrito.
- Lotes vencidos, bloqueados, cancelados o agotados no cuentan como disponibles.
- Productos proximos a vencer se pueden vender con advertencia.
- La busqueda acepta nombre, codigo interno y codigo de barras.
- El lector de codigo de barras funcionara como teclado.
- Si hay coincidencia exacta por codigo, se puede agregar rapido al carrito.
- El carrito permite aumentar, reducir, eliminar productos y vaciarse.
- El inventario no cambia mientras el producto esta en carrito.
- Solo se aceptan cantidades enteras.
- El precio no se modifica manualmente en V1.
- No hay descuentos, impuestos visibles, recargos ni redondeos especiales.

## Venta y Pago

- La venta se crea recien al confirmar pago.
- No hay ventas en borrador en V1.
- La venta V1 es anonima o consumidor final.
- No se exige cliente, NIT ni razon social.
- Cada venta tendra correlativo global legible, recomendado `V-000001`.
- El comprobante interno no es factura fiscal.
- El pago V1 es unico y en efectivo.
- No hay QR real, tarjeta, pagos mixtos, credito ni cuentas por cobrar.
- El vendedor registra monto recibido.
- El sistema calcula cambio.
- El monto recibido debe ser igual o mayor al total.
- Para caja, el ingreso esperado suma el total de la venta y no el monto recibido bruto.

## FEFO e Inventario

- El vendedor no elige lote.
- El sistema descuenta automaticamente por FEFO.
- Primero se consume el lote con vencimiento mas cercano.
- Si un lote no alcanza, se continua con los siguientes lotes disponibles.
- Una linea de venta puede consumir varios lotes o capas.
- Si el stock total vendible no alcanza, se cancela toda la venta.
- Cada consumo genera movimiento de inventario de salida por venta.
- El margen usa el costo real de los lotes consumidos.
- El detalle de venta conserva los lotes usados, vencimientos, cantidades y costos.

## Anulacion

- La venta confirmada puede anularse en V1.
- Vendedor anula solo ventas propias del dia.
- Vendedor solo anula ventas de su caja abierta.
- Admin y superadmin pueden anular ventas de cualquier vendedor si la caja asociada sigue abierta.
- Toda anulacion requiere motivo.
- No se anulan ventas de cajas cerradas.
- No se anulan ventas con factura fiscal asociada cuando exista SIAT.
- La venta anulada no se borra; cambia de estado.
- El pago se marca como anulado o revertido, sin borrarse.
- El inventario se repone a los mismos lotes consumidos.
- Se generan movimientos inversos de inventario.
- El esperado de caja se recalcula con ventas efectivas netas.
- No se crea egreso manual separado en V1.

## Carritos Pendientes

- Se pueden guardar carritos pendientes.
- Un carrito pendiente no es venta.
- No descuenta inventario.
- No reserva stock.
- No congela precio.
- Puede tener nombre corto o nota.
- Pertenece al vendedor que lo creo.
- Vendedor ve, edita, descarta y cobra solo sus pendientes.
- Admin y superadmin pueden ver y descartar pendientes de todos.
- En V1 no se reasignan pendientes.
- Los pendientes expiran a los 3 dias.
- Se pueden ver y editar sin caja abierta.
- Para cobrar un pendiente se exige caja abierta.
- Al retomar, se revalidan stock, precio y estado del producto.
- Si el precio cambio, se advierte y se cobra el precio actual.
- Si el cobro falla, el pendiente se conserva.
- Si el cobro funciona, el pendiente deja de estar activo y queda la venta oficial.

## Visibilidad y Roles

- Vendedor abre y cierra su propia caja.
- Vendedor registra ventas con su caja abierta.
- Vendedor ve sus ventas y sus pendientes.
- Admin puede vender con su propia caja si la abre.
- Admin puede revisar ventas, cajas y pendientes de todos.
- Admin puede cerrar caja ajena.
- Admin puede anular ventas permitidas de cualquier vendedor.
- Superadmin puede supervisar todo igual que admin.

## Documentacion

- El flujo se documentara como venta operativa interna, no como facturacion fiscal.
- La tesis debe reflejar caja simple, pago efectivo, FEFO, trazabilidad por lote, margen por costo real y anulacion controlada.
- Nota de cierre: la evidencia posterior al Sprint 08 confirma pendientes POS, anulacion y supervision administrativa como capacidades V1 ejecutables, sin modificar las decisiones aceptadas ni ampliar el alcance fuera de pago efectivo, comprobante interno y control operativo de farmacia.
