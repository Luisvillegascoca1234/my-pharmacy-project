## Problem Statement

El punto de partida del PRD fue la necesidad de un flujo de venta de mostrador que permita cobrar rapido, descontar inventario por lote de forma confiable y cuadrar caja al final del turno. El inventario ya nace desde compras recibidas y movimientos, por lo que el flujo POS V1 completa la salida trazable de ese stock mediante ventas pagadas con evidencia sobre producto, lote, costo real, vendedor, pago y sesion de caja.

El problema operativo no es solo registrar una venta. En farmacia, la salida debe respetar FEFO para reducir riesgo de vencimiento, debe bloquear stock insuficiente, debe dejar movimientos de salida por cada lote consumido y debe calcular margen real usando el costo de las capas vendidas. Al mismo tiempo, el vendedor necesita una pantalla rapida de POS, con busqueda por nombre o codigo, carrito editable, pago efectivo con cambio y la posibilidad de guardar carritos pendientes sin reservar stock.

Tambien se necesita caja simple. Cada vendedor debe operar con una caja abierta, registrar efectivo recibido, cerrar con monto contado y permitir supervision administrativa cuando haya diferencias o cuando un admin deba cerrar una caja ajena. La venta confirmada debe poder anularse bajo reglas controladas mientras la caja siga abierta, devolviendo inventario a los lotes originales y ajustando el efectivo esperado.

## Solution

El flujo V1 de ventas POS, caja y pagos queda definido para una farmacia de una sucursal. El vendedor abre caja con monto inicial, vende productos activos con stock disponible, cobra en efectivo y cierra caja ingresando el monto contado final. El sistema calcula el esperado, la diferencia y deja evidencia de apertura, ventas, anulaciones y cierre.

El POS sera una pantalla rapida de mostrador: busqueda/listado de productos a la izquierda, carrito y cobro a la derecha, estado de caja siempre visible y confirmacion de pago en efectivo. La venta se creara recien al confirmar el pago; mientras tanto, el carrito no afecta inventario. Si el vendedor guarda un carrito pendiente, este tampoco reserva stock ni congela precio: al retomarlo se revalidan precio y disponibilidad, y al cobrar se usan las condiciones actuales.

La salida de inventario se realiza por FEFO automaticamente. El vendedor no elige lotes. Si el primer lote no alcanza, el sistema completa con los siguientes lotes disponibles. Si el total vendible no alcanza, la venta completa se rechaza. Cada consumo de lote genera un movimiento de inventario y cada item conserva el costo usado para calcular margen real.

La venta tiene un comprobante interno con correlativo global, productos, cantidades, precios, total, efectivo recibido, cambio, vendedor y caja asociada. No es factura fiscal. La facturacion SIAT queda como modulo separado para una fase posterior.

## Estado de cierre documental

La evidencia de cierre confirma que pendientes POS, anulacion de ventas y supervision administrativa son capacidades V1 ejecutables y validadas tecnicamente dentro del alcance aprobado. Las brechas historicas sobre API ejecutable, pago revertido, reposicion por lote, movimientos inversos, ajuste neto de caja, listado administrativo y ciclo de pendientes quedaron resueltas por el correctivo del Sprint 08 y reconciliadas documentalmente en el Sprint 09.

## User Stories

1. Como vendedor, quiero entrar al POS y saber si tengo caja abierta, so that pueda vender sin dudas sobre mi estado operativo.
2. Como vendedor, quiero abrir caja con monto inicial, so that el sistema pueda calcular el efectivo esperado al cierre.
3. Como vendedor, quiero poder abrir caja con monto inicial cero, so that pueda iniciar turno aunque no haya fondo fijo.
4. Como vendedor, quiero que el sistema rechace montos iniciales negativos, so that caja no nazca con datos imposibles.
5. Como vendedor, quiero que solo exista una caja abierta a mi nombre, so that no duplique turnos ni pagos.
6. Como vendedor, quiero que el POS me guie a abrir caja si intento vender sin caja abierta, so that no tenga que buscar manualmente la opcion.
7. Como vendedor, quiero cerrar mi caja ingresando el monto contado final, so that el sistema calcule diferencia contra lo esperado.
8. Como vendedor, quiero poder cerrar caja aunque haya diferencia, so that pueda finalizar turno sin bloquear la operacion real.
9. Como vendedor, quiero agregar una nota opcional al cierre, so that pueda explicar faltantes o sobrantes.
10. Como administrador, quiero ver cajas de vendedores, so that pueda supervisar turnos, ventas, anulaciones y diferencias.
11. Como administrador, quiero cerrar una caja ajena con monto contado final, so that pueda resolver cierres cuando el vendedor no pueda hacerlo.
12. Como superadmin, quiero cerrar cajas ajenas igual que admin, so that pueda supervisar cualquier caso operativo.
13. Como auditor administrativo, quiero saber quien abrio y quien cerro una caja, so that una intervencion administrativa quede trazable.
14. Como vendedor, quiero buscar productos activos con stock disponible, so that el flujo principal muestre productos vendibles.
15. Como vendedor, quiero buscar por nombre comercial, nombre generico, codigo interno o codigo de barras, so that pueda atender rapido con teclado o lector.
16. Como vendedor, quiero que una coincidencia exacta por codigo pueda agregarse al carrito, so that el lector de barras funcione como entrada rapida.
17. Como vendedor, quiero ver stock total disponible y proximo vencimiento, so that sepa si puedo vender y si el producto esta cerca de vencer.
18. Como vendedor, quiero recibir advertencias por proximidad de vencimiento, so that venda con informacion sin bloquear productos aun vigentes.
19. Como vendedor, quiero que lotes vencidos, bloqueados, cancelados o agotados no cuenten como disponibles, so that no venda stock no apto.
20. Como vendedor, quiero agregar productos al carrito, so that prepare la venta antes de cobrar.
21. Como vendedor, quiero aumentar cantidades en carrito, so that pueda atender compras de varias unidades.
22. Como vendedor, quiero reducir cantidades en carrito, so that pueda corregir cambios del cliente.
23. Como vendedor, quiero eliminar productos del carrito, so that pueda corregir errores antes del pago.
24. Como vendedor, quiero vaciar el carrito, so that pueda cancelar una venta no confirmada.
25. Como vendedor, quiero que el carrito no descuente inventario, so that no reserve stock antes del pago real.
26. Como vendedor, quiero que la venta se cree recien al confirmar pago, so that no existan ventas incompletas.
27. Como vendedor, quiero que el backend revalide stock al cobrar, so that la venta use disponibilidad real del momento.
28. Como vendedor, quiero que si ya no hay stock suficiente se rechace toda la venta, so that no queden pagos ni movimientos parciales.
29. Como vendedor, quiero vender solo cantidades enteras, so that el POS V1 sea simple y consistente con unidad base discreta.
30. Como vendedor, quiero que el precio venga del producto sin edicion manual, so that se eviten errores y descuentos no autorizados.
31. Como vendedor, quiero que el total sea cantidad por precio, so that el cobro sea claro sin impuestos ni descuentos visibles en V1.
32. Como vendedor, quiero registrar monto recibido en efectivo, so that el sistema calcule cambio.
33. Como vendedor, quiero que el sistema bloquee pagos menores al total, so that no confirme ventas impagas.
34. Como vendedor, quiero que caja sume el total de venta y no el efectivo bruto recibido, so that el cambio no infle el esperado.
35. Como vendedor, quiero que cada venta tenga un comprobante interno, so that pueda consultar o imprimir una constancia operativa.
36. Como vendedor, quiero que el comprobante tenga numero interno legible, so that pueda buscar la venta sin usar un ID tecnico.
37. Como administrador, quiero que el correlativo de ventas sea global y consecutivo, so that sea facil auditar y conversar sobre ventas.
38. Como administrador, quiero que cada caja tenga correlativo interno global, so that pueda revisar cierres y ventas asociadas.
39. Como vendedor, quiero que FEFO elija lotes automaticamente, so that no tenga que decidir lote durante la atencion.
40. Como vendedor, quiero que una venta pueda consumir varios lotes si uno no alcanza, so that el sistema complete la cantidad pedida correctamente.
41. Como administrador, quiero que cada salida de lote genere movimiento de inventario, so that el kardex explique cada disminucion.
42. Como administrador, quiero que el margen se calcule con costo real de cada lote consumido, so that el analisis financiero sea confiable.
43. Como vendedor, quiero ver solo mis ventas, so that el POS no se llene de operaciones ajenas.
44. Como administrador, quiero ver ventas de todos los vendedores con filtros, so that pueda supervisar por fecha, vendedor y caja.
45. Como superadmin, quiero ver ventas de todos los vendedores, so that pueda auditar operaciones completas.
46. Como vendedor, quiero anular una venta propia del dia mientras mi caja siga abierta, so that pueda corregir errores recientes.
47. Como vendedor, quiero que toda anulacion exija motivo, so that la reversa tenga explicacion administrativa.
48. Como administrador, quiero anular ventas de cualquier vendedor mientras la caja asociada siga abierta, so that pueda resolver incidencias operativas.
49. Como superadmin, quiero anular ventas de cualquier vendedor bajo las mismas reglas, so that pueda intervenir cuando sea necesario.
50. Como administrador, quiero que una venta con caja cerrada no se pueda anular en V1, so that no se alteren cierres ya consolidados.
51. Como administrador, quiero que la anulacion devuelva stock a los mismos lotes consumidos, so that la trazabilidad por lote quede completa.
52. Como administrador, quiero que la anulacion genere movimientos inversos, so that inventario explique la reposicion.
53. Como administrador, quiero que la anulacion ajuste automaticamente el esperado de caja, so that la caja refleje ventas efectivas netas.
54. Como auditor administrativo, quiero que el pago anulado no se borre, so that exista evidencia del cobro original y su reversa.
55. Como vendedor, quiero guardar un carrito pendiente con nombre o nota, so that pueda pausar una atencion sin crear venta.
56. Como vendedor, quiero ver una lista de mis carritos pendientes en el POS, so that pueda retomarlos rapido.
57. Como vendedor, quiero editar un carrito pendiente, so that pueda agregar, quitar o cambiar cantidades antes de cobrar.
58. Como vendedor, quiero que un carrito pendiente no reserve stock, so that no bloquee inventario real.
59. Como vendedor, quiero que un carrito pendiente no congele precio, so that el cobro use el precio vigente.
60. Como vendedor, quiero recibir advertencia si el precio cambio al retomar un carrito, so that revise antes de cobrar.
61. Como vendedor, quiero retomar carritos sin caja abierta, so that pueda preparar la venta antes de abrir caja.
62. Como vendedor, quiero que para cobrar un pendiente si se exija caja abierta, so that el pago quede asociado a una caja.
63. Como vendedor, quiero que mis carritos pendientes expiren a los 3 dias, so that no se acumulen ventas obsoletas.
64. Como vendedor, quiero que un pendiente expirado no pueda cobrarse, so that no use precios o stock demasiado viejos.
65. Como vendedor, quiero que al cobrar correctamente un pendiente deje de aparecer como pendiente, so that no duplique operaciones.
66. Como administrador, quiero ver y descartar carritos pendientes de todos, so that pueda limpiar trabajo operativo obsoleto.
67. Como vendedor, quiero que no pueda cobrar carritos de otro vendedor, so that cada venta quede ligada al responsable correcto.
68. Como administrador, quiero que no haya pagos mixtos en V1, so that caja y POS se mantengan simples.
69. Como administrador, quiero que credito, tarjeta y QR real queden fuera de V1, so that el primer flujo sea estable antes de ampliar medios de pago.
70. Como auditor administrativo, quiero que apertura, venta, anulacion y cierre queden auditados, so that se pueda reconstruir que paso, quien lo hizo y cuando.

## Implementation Decisions

- La caja se define por usuario autenticado y estado operativo `open` o `closed`.
- Una caja esta abierta cuando existe una sesion `open` para el usuario, sin fecha de cierre.
- Un usuario no puede tener mas de una caja abierta al mismo tiempo.
- Vendedor, admin y superadmin pueden abrir su propia caja.
- Vendedor cierra solo su caja.
- Admin y superadmin pueden cerrar caja ajena ingresando monto contado final.
- Todo cierre conserva el usuario que abrio la caja y el usuario que la cerro.
- El monto inicial puede ser cero o mayor, nunca negativo.
- El cierre calcula `expectedAmount = openingAmount + netCashSalesAmount`.
- La diferencia se calcula como `countedAmount - expectedAmount`.
- El cierre con diferencia esta permitido.
- La nota de cierre es opcional.
- La caja tendra correlativo global legible, recomendado `C-000001`.
- La venta exige caja abierta al momento de confirmar pago.
- La venta se crea recien al confirmar pago; no hay venta en borrador en V1.
- El carrito activo vive como preparacion de venta y no afecta inventario.
- El pago V1 es unico y en efectivo.
- El monto recibido debe ser igual o mayor al total.
- El cambio se calcula como `receivedAmount - totalAmount`.
- Caja suma el total de la venta, no el monto recibido bruto.
- La venta tendra correlativo global legible, recomendado `V-000001`.
- La venta V1 sera anonima o consumidor final.
- No se exigira cliente, NIT ni razon social.
- El comprobante interno no es factura fiscal.
- Los impuestos, descuentos, recargos y redondeos especiales quedan fuera de V1.
- Los precios se toman del producto vigente; no hay edicion manual de precio.
- Las cantidades de venta seran enteras.
- El POS muestra productos activos con stock vendible.
- Productos inactivos no aparecen en el flujo principal de POS.
- Lotes vencidos, bloqueados, cancelados o agotados no cuentan como stock vendible.
- Los productos proximos a vencer pueden venderse, pero se advierten.
- El vendedor no selecciona lote.
- FEFO descuenta automaticamente primero la fecha de vencimiento mas cercana.
- Si hay empate operativo entre capas del mismo vencimiento, se prioriza la capa mas antigua.
- Una linea de venta puede consumir varios lotes o capas.
- Si la suma vendible no alcanza, se rechaza toda la venta.
- Cada consumo de lote genera movimiento de inventario de salida por venta.
- El movimiento de inventario referencia la venta, el item vendido y la capa consumida.
- El margen se calcula con precio vendido menos costo real de las capas consumidas.
- La busqueda POS acepta nombre, codigo interno y codigo de barras.
- Un lector de codigo de barras se tratara como entrada de teclado.
- La validacion de stock se hara en UI para feedback y en backend como validacion definitiva.
- Los carritos pendientes no son ventas.
- Los carritos pendientes no reservan stock ni congelan precio.
- Los carritos pendientes pueden tener nombre corto o nota.
- Los carritos pendientes pertenecen al vendedor creador.
- Admin y superadmin pueden ver o descartar pendientes de todos.
- En V1 no se reasignan carritos pendientes.
- Un vendedor no cobra carritos ajenos.
- Un carrito pendiente expira a los 3 dias.
- Al retomar un pendiente, se revalidan stock, precio y estado de producto.
- Si el precio cambio, se informa antes de cobrar y se cobra precio vigente.
- Si un producto quedo inactivo o sin stock suficiente, se debe ajustar el pendiente antes de cobrar.
- Al cobrar un pendiente correctamente, deja de estar pendiente y queda la venta como registro oficial.
- Si el cobro falla, el pendiente se conserva para correccion.
- Las ventas confirmadas pueden anularse en V1 bajo reglas controladas.
- Vendedor anula solo ventas propias, del dia, asociadas a su caja abierta.
- Admin y superadmin pueden anular ventas de cualquier vendedor si la caja asociada sigue abierta.
- Toda anulacion exige motivo.
- No se permite anular ventas de cajas cerradas en V1.
- No se permite anular ventas con factura fiscal asociada cuando exista ese modulo.
- Anular una venta cambia su estado a `cancelled`; no borra la venta.
- La anulacion marca el pago como anulado o revertido; no borra el pago original.
- La anulacion repone stock a los mismos lotes consumidos.
- La anulacion crea movimientos inversos de inventario.
- El esperado de caja se calcula con ventas efectivas netas, excluyendo ventas anuladas.
- Vendedor ve sus ventas.
- Admin y superadmin ven ventas de todos con filtros por fecha, vendedor, caja y estado.
- Las operaciones de caja, venta, pago, consumo FEFO, anulacion y cierre deben ser transaccionales cuando cambian mas de un registro operativo.
- Se requieren contratos compartidos para caja, venta, pago, carrito pendiente, anulacion y busqueda POS.
- Se requieren estados explicitos para caja, venta, pago y carrito pendiente.
- Se requieren endpoints de apertura, cierre, caja actual, busqueda POS, creacion de venta, detalle de venta, anulacion y gestion de carritos pendientes.
- Se requiere documentacion OpenAPI minima para los contratos nuevos.

## Testing Decisions

- Las pruebas deben validar comportamiento externo y reglas de dominio, no detalles internos.
- El foco principal debe estar en caja, venta transaccional, FEFO, anulacion y carritos pendientes.
- Se deben probar reglas de apertura: monto cero permitido, monto negativo rechazado y una sola caja abierta por usuario.
- Se deben probar reglas de cierre: esperado, contado, diferencia, cierre con diferencia y cierre ajeno por admin/superadmin.
- Se deben probar permisos: vendedor opera su caja y sus ventas; admin/superadmin supervisan y cierran/anulan segun reglas.
- Se deben probar creacion de venta con caja abierta y rechazo sin caja abierta.
- Se deben probar pago efectivo: monto recibido insuficiente, cambio y asociacion con caja.
- Se deben probar FEFO: consumo de un lote, consumo de varios lotes, empate por antiguedad, stock insuficiente y exclusion de lotes no vendibles.
- Se deben probar movimientos de inventario de salida con referencia correcta a venta, item y lote.
- Se deben probar margen por item cuando una linea consume una o varias capas.
- Se deben probar anulaciones: motivo obligatorio, venta propia del dia, bloqueo por caja cerrada, reposicion a mismos lotes, movimientos inversos y pago revertido.
- Se deben probar carritos pendientes: guardado, edicion, expiracion a 3 dias, revalidacion de precio/stock, conversion a venta y conservacion cuando falla el cobro.
- Se deben probar listados y filtros de ventas, cajas y pendientes segun rol.
- En frontend, las pruebas mas utiles estan en comportamiento de estado y facades: carrito activo, pendientes, cobro, errores, resets y carga de caja actual.
- Las pantallas deben cubrir estados de carga, vacio, error, caja cerrada, caja abierta, stock insuficiente, pendiente expirado y venta anulada cuando se agreguen pruebas de UI.
- No se planifica QA manual en este PRD salvo que el usuario lo pida explicitamente.

## Epic Breakdown

Epic principal: `ventas-pos-caja-y-pagos`

Objetivo del epic: entregar el flujo operativo de mostrador para abrir caja, vender con pago efectivo, descontar inventario por FEFO, generar comprobante interno, anular ventas controladas y cerrar caja con diferencia calculada.

Resultado esperado: vendedor puede abrir caja, operar POS, guardar pendientes, cobrar ventas en efectivo, consultar sus ventas, anular ventas permitidas y cerrar caja; admin/superadmin pueden supervisar ventas y cajas, cerrar caja ajena y anular operaciones permitidas.

Secuencia recomendada:

1. `INFRA/BACKEND` - Contratos compartidos, estados, persistencia y documentacion minima de API para caja, venta, pago, carritos pendientes y anulacion.
2. `BACKEND` - Caja: apertura, caja actual, cierre propio, cierre ajeno, totales esperados, diferencias y permisos.
3. `BACKEND` - POS y ventas: busqueda vendible, creacion transaccional de venta, pago efectivo, FEFO, movimientos de salida y margen.
4. `BACKEND` - Anulaciones y pendientes: reversa de venta, movimientos inversos, pago revertido, impacto en caja y ciclo de carritos pendientes.
5. `UI` - Caja y POS base: caja actual, apertura, busqueda, carrito, pago efectivo y comprobante interno.
6. `UI` - Carritos pendientes, anulaciones, detalle de venta, vistas de caja y supervision administrativa.
7. `INFRA` - Pruebas de dominio, OpenAPI, navegacion, permisos visibles y cierre de integracion.

Dependencias:

- Productos activos con precio de venta y codigos.
- Inventario por capas/lotes con stock disponible, vencimiento, estado y costo base.
- Movimientos de inventario existentes como base analitica.
- Roles base `seller`, `admin` y `superadmin`.
- Autenticacion con usuario actual disponible para asociar caja, venta y auditoria.

## Out of Scope

- QR real.
- Tarjeta.
- Pagos mixtos.
- Credito o cuentas por cobrar.
- Factura SIAT real.
- Cliente formal, NIT o razon social en venta.
- Descuentos, promociones o cambio manual de precio.
- Impuestos visibles en POS.
- Reapertura de caja cerrada.
- Anulacion de ventas de cajas cerradas.
- Devoluciones posteriores a cierre de caja.
- Reasignacion de carritos pendientes.
- Reserva de stock por carrito pendiente.
- Fraccionamiento o cantidades decimales.
- Equivalencias comerciales avanzadas en venta.
- Cierre con desglose de billetes y monedas.
- Reportes analiticos completos.

## Further Notes

- La decision central de V1 es privilegiar consistencia operativa: venta y pago nacen juntos, inventario se descuenta solo al cobrar, y caja se calcula con ventas netas efectivas.
- Los carritos pendientes son conveniencia de mostrador, no compromiso comercial. Por eso no reservan stock ni precio.
- La anulacion se incluye en V1 por necesidad operativa, pero queda limitada a cajas abiertas para no alterar cierres consolidados.
- El modulo fiscal futuro debe bloquear o restringir anulaciones cuando exista factura asociada.
- El comprobante interno ayuda a atencion y auditoria, pero debe diferenciarse claramente de una factura.
- El epic requirio cierre de documentacion y tesis porque introduce el flujo comercial principal de salida de inventario, caja, pagos y margen.
