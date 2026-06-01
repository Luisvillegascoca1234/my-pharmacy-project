# Flujo operativo farmaceutico de mostrador

## Proposito

Este documento describe como debe operar el mostrador de farmacia en el flujo V1 de ventas POS, caja y pagos. La guia se centra en lo que debe lograr cada usuario y en las reglas farmaceuticas que gobiernan la atencion, sin explicar detalles internos del sistema.

El flujo cubre apertura de caja, busqueda de productos vendibles, cobro efectivo, descuento de inventario por FEFO, comprobante interno, carritos pendientes, anulacion controlada y supervision administrativa. Las brechas de rutas ausentes registradas al cierre del Sprint 07 quedan reconciliadas por el correctivo backend; la validacion final del epic debe confirmar el comportamiento completo antes del cierre documental definitivo.

## Responsabilidades por rol

### Vendedor

- Abre una caja propia antes de cobrar ventas.
- Atiende al cliente en el POS, busca productos por nombre comercial, principio activo, codigo interno o codigo de barras.
- Arma el carrito, corrige cantidades enteras y confirma el pago en efectivo.
- Registra el monto recibido y entrega el cambio calculado.
- Puede preparar o retomar carritos pendientes propios, sin afectar inventario.
- Puede anular solo ventas propias permitidas mientras la caja asociada siga abierta.
- Cierra su caja con el monto contado final y una nota si existe diferencia.

### Admin

- Puede operar su propia caja si atiende mostrador.
- Supervisa cajas, ventas y pendientes de vendedores.
- Puede cerrar una caja ajena ingresando el monto contado final.
- Puede descartar pendientes de cualquier vendedor cuando esten obsoletos o no correspondan.
- Puede anular ventas permitidas de cualquier vendedor mientras la caja asociada siga abierta, con motivo obligatorio.

### Superadmin

- Tiene las mismas capacidades operativas de supervision que admin.
- Interviene en cierres sensibles, diferencias relevantes y control global del flujo de mostrador.

## Estado de integracion V1

El flujo disponible para integracion operativa cubre apertura de caja, consulta de caja actual, cierre de caja propia o seleccionada, busqueda de productos vendibles, venta anonima en efectivo, calculo de cambio, comprobante interno, descuento automatico por FEFO, ciclo de carritos pendientes, anulacion controlada y listados paginados de supervision.

El correctivo backend resuelve la deuda de disponibilidad registrada para carritos pendientes, anulacion de ventas y listados administrativos de supervision. La guia conserva esas reglas como parte del flujo V1 y deja como deuda no bloqueante la validacion final de cierre, no la ausencia de endpoints.

### Deuda operativa no bloqueante

- Cierre final del epic: impacto, pendientes, anulacion y supervision ya cuentan con contrato operativo reconciliado, pero deben pasar el guardrail final antes de marcar el epic completo como cerrado. Motivo, ese paso consolida evidencia tecnica y documenta cualquier diferencia residual.

## Apertura de caja

El vendedor, admin o superadmin que vaya a cobrar debe iniciar una caja propia. La caja representa el turno efectivo del usuario y permite asociar ventas, pagos, anulaciones permitidas y cierre.

Reglas:

- El monto inicial puede ser cero o mayor.
- No se aceptan montos negativos.
- Un usuario no debe tener dos cajas abiertas al mismo tiempo.
- La caja abierta identifica al responsable de las ventas del turno.
- La caja no se reutiliza despues del cierre.

El vendedor puede preparar una atencion sin caja abierta, pero no puede confirmar el cobro hasta abrir caja.

## Venta POS en efectivo

La venta V1 es una venta anonima o de consumidor final. No exige cliente formal, NIT ni razon social.

Flujo esperado:

1. Buscar productos activos con stock vendible.
2. Agregar productos al carrito.
3. Ajustar cantidades enteras.
4. Confirmar pago en efectivo.
5. Registrar el monto recibido.
6. Entregar el cambio calculado.
7. Emitir el comprobante interno.

Reglas:

- La venta nace recien al confirmar el pago.
- El carrito activo no descuenta inventario.
- El precio se toma del precio vigente del producto.
- No hay edicion manual de precio, descuentos ni promociones en V1.
- El monto recibido debe ser igual o mayor al total.
- El cambio se calcula como monto recibido menos total de venta.
- La caja suma el total de la venta, no el efectivo bruto recibido.
- Si el pago es insuficiente, la venta no se confirma.
- Si el stock vendible no alcanza, la venta completa se rechaza.
- Si un producto queda inactivo o no vendible, debe retirarse o reemplazarse antes de cobrar.

## FEFO y vencimientos

FEFO significa que sale primero el lote con vencimiento mas cercano. En farmacia esta regla reduce merma por vencimiento y mejora la trazabilidad sanitaria del inventario.

Reglas:

- El vendedor no selecciona lote manualmente.
- El sistema descuenta automaticamente el lote vigente con vencimiento mas proximo.
- Si el primer lote no alcanza, se completa con los siguientes lotes disponibles.
- Los lotes vencidos, bloqueados, cancelados o agotados no cuentan como stock vendible.
- Los productos proximos a vencer pueden venderse mientras sigan vigentes, pero deben mostrarse con advertencia.
- Cada venta conserva evidencia de los lotes consumidos, cantidades, vencimientos y costo usado para margen.

## Carritos pendientes

Un carrito pendiente representa una atencion pausada, no una venta. Sirve para guardar temporalmente una preparacion cuando el cliente debe confirmar algo, cambiar productos o volver mas tarde.

Reglas:

- El pendiente no reserva stock.
- El pendiente no congela precio.
- Puede tener nombre corto o nota.
- Pertenece al vendedor que lo creo.
- El vendedor puede retomar, editar, descartar o cobrar sus propios pendientes.
- Admin y superadmin pueden revisar y descartar pendientes de todos.
- Un pendiente expira a los 3 dias.
- Un pendiente expirado no debe cobrarse.
- Al retomar o cobrar, se revalidan precio, stock y estado de producto.
- Si el precio cambio, se informa y se cobra el precio vigente.
- Si el stock ya no alcanza, se corrige cantidad o se retira el producto antes del cobro.
- Si el cobro falla, el pendiente se conserva para correccion.
- Si el cobro se completa, el pendiente deja de estar activo y la venta confirmada pasa a ser el registro oficial.

## Anulacion de ventas

La anulacion V1 corrige errores recientes de mostrador sin alterar cajas ya consolidadas.

Reglas:

- Toda anulacion exige motivo.
- El vendedor solo puede anular ventas propias permitidas del dia.
- La venta debe estar asociada a una caja abierta.
- Admin y superadmin pueden anular ventas permitidas de cualquier vendedor mientras la caja asociada siga abierta.
- No se anulan ventas de cajas cerradas en V1.
- La venta anulada no se borra; queda como registro historico.
- El pago original no se borra; queda evidencia de la reversa.
- El inventario debe reponerse a los mismos lotes consumidos.
- La caja debe reflejar ventas efectivas netas.
- Cuando exista factura fiscal asociada, la anulacion interna no debe reemplazar la anulacion fiscal correspondiente.

## Cierre de caja

El cierre de caja confirma el resultado del turno de mostrador. El usuario ingresa el monto contado final y el sistema compara contra el esperado.

Reglas:

- El esperado parte del monto inicial y suma ventas efectivas netas.
- El monto contado es el efectivo real encontrado al cierre.
- La diferencia puede ser cero, positiva o negativa.
- Se permite cerrar con diferencia para reflejar la operacion real.
- La nota de cierre permite explicar faltantes, sobrantes u observaciones.
- El vendedor cierra su propia caja.
- Admin y superadmin pueden cerrar caja ajena cuando el responsable no puede hacerlo o cuando corresponde supervision.
- Una caja cerrada no se reabre en V1.

## Comprobante interno y factura fiscal

El comprobante interno es una constancia operativa de la venta POS. Sirve para atencion, consulta y auditoria interna de caja e inventario.

Debe incluir:

- Numero interno de venta.
- Caja asociada.
- Vendedor.
- Fecha y hora.
- Productos, cantidades, precios y total.
- Monto recibido y cambio.
- Evidencia de consumo FEFO cuando corresponda.

La factura fiscal es un documento tributario separado. En V1 no hay facturacion SIAT real, QR fiscal ni validacion tributaria en linea. El comprobante interno no reemplaza factura fiscal y no debe presentarse como documento SIAT.

## Limites de V1

Estos limites son parte del alcance aceptado y no deben interpretarse como errores:

- Sin integracion SIAT real.
- Sin QR real.
- Sin pago con tarjeta.
- Sin credito ni cuentas por cobrar.
- Sin pagos mixtos.
- Sin descuentos ni promociones.
- Sin cliente formal, NIT ni razon social.
- Sin cantidades decimales en venta POS.
- Sin reapertura de caja cerrada.
- Sin devoluciones posteriores al cierre de caja.
- Sin reportes analiticos completos.

## Cuando una venta no puede confirmarse

La venta debe bloquearse o corregirse antes del cobro cuando:

- No hay caja propia abierta.
- El carrito esta vacio.
- Alguna cantidad no es entera positiva.
- El efectivo recibido no cubre el total.
- El stock vendible no alcanza.
- El producto ya no esta activo o no es vendible.
- Un pendiente esta expirado.
- Un pendiente tiene precio, stock o producto pendiente de correccion.

El objetivo es evitar ventas incompletas, pagos sin inventario, salidas sin lote o diferencias de caja que no correspondan a una operacion real.
