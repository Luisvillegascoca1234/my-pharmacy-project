## Problem Statement

El flujo POS permite vender, cobrar en efectivo, consumir inventario por FEFO, anular ventas permitidas mientras la caja sigue abierta y conservar comprobantes internos. El cierre administrativo V1 agrega el control posterior a la venta: preparar factura interna sin integracion SIAT real, controlar devoluciones despues del cierre de caja, consultar auditoria, producir reportes operativos y exportar datos limpios para analisis externo.

La farmacia necesita separar con claridad la venta POS del documento fiscal preparado. El comprobante interno no debe confundirse con factura tributaria, pero administracion necesita dejar una factura preparada con correlativo propio, datos fiscales minimos y estado controlado. Tambien necesita cancelar esa factura preparada sin tocar la venta ni el inventario.

La devolucion posterior al cierre de caja es distinta de la anulacion POS. La anulacion corrige una venta mientras la caja asociada esta abierta; la devolucion administrativa ocurre cuando la venta ya salio del flujo de caja abierta y devuelve todo el stock a los lotes originales sin reabrir caja cerrada. Esa diferencia queda visible en estado, pago, movimientos, auditoria y reportes.

Antes del cierre administrativo V1, el sistema ya escribia eventos de auditoria y movimientos, pero el usuario administrativo necesitaba una superficie consultable y exportable para revisar operaciones sensibles, ventas netas, valuacion de inventario y productos proximos a vencer.

## Solution

El chunk 10 queda definido como cierre administrativo V1 para facturacion preparada, devoluciones totales, auditoria consultable, reportes iniciales y exportaciones CSV.

La factura preparada es una entidad separada de venta, con correlativo interno propio, estado `prepared` o `cancelled`, snapshot de la venta y datos fiscales opcionales. Se crea solo desde ventas confirmadas vigentes, no anuladas, no devueltas y sin factura activa. Si una factura preparada fue cancelada, se puede crear otra para la misma venta vigente, conservando historial. La cancelacion exige motivo y auditoria.

La devolucion es total en V1. Solo `admin` y `superadmin` pueden registrar una devolucion administrativa. La devolucion queda bloqueada si la venta esta anulada, ya devuelta, con caja abierta anulable o con factura preparada activa. Si la venta tuvo factura preparada activa, primero debe cancelarse; una factura `cancelled` no bloquea la devolucion. La devolucion marca la venta como `returned`, marca el pago como `refunded`, repone inventario a los mismos lotes consumidos, registra movimientos `sale_returned`, guarda snapshot por lote y audita la operacion.

La auditoria es consultable por `superadmin` con paginacion, filtros basicos y metadata completa. Los reportes V1 cubren ventas diarias, valuacion de inventario y productos proximos a vencer. Las exportaciones CSV cubren ventas y movimientos de inventario, con separador punto y coma para compatibilidad regional y fechas ISO.

## User Stories

1. As an admin, I want preparar una factura desde una venta vigente, so that exista un documento fiscal interno separado del comprobante POS.
2. As an admin, I want que la factura tenga correlativo propio, so that no se mezcle con el correlativo de venta.
3. As an admin, I want ingresar NIT y razon social al preparar factura, so that pueda conservar datos fiscales minimos cuando el cliente los entregue.
4. As an admin, I want que una factura sin datos fiscales use consumidor final, so that el documento tenga snapshot completo sin campos ambiguos.
5. As an admin, I want ver ventas elegibles para facturacion, so that pueda preparar facturas sin buscar manualmente entre ventas invalidas.
6. As an admin, I want que una venta anulada no sea facturable, so that no se emitan documentos sobre operaciones no vigentes.
7. As an admin, I want que una venta devuelta no sea facturable, so that no se preparen documentos sobre operaciones revertidas.
8. As an admin, I want que una venta con factura activa no genere otra factura activa, so that no existan duplicados fiscales.
9. As an admin, I want poder generar una nueva factura si la anterior fue cancelada, so that pueda corregir un documento preparado sin perder historial.
10. As an admin, I want cancelar una factura preparada con motivo, so that una correccion fiscal interna quede justificada.
11. As an admin, I want que anular factura no anule la venta, so that la separacion entre venta y factura sea real.
12. As a seller, I want no poder crear ni anular facturas, so that facturacion quede bajo control administrativo.
13. As a superadmin, I want ver todas las facturas por estado, so that pueda revisar documentos preparados y cancelados.
14. As an admin, I want registrar devolucion total de una venta cerrada, so that pueda resolver devoluciones posteriores sin reabrir caja.
15. As an admin, I want que la devolucion sea total en V1, so that el flujo sea simple y auditado sin calculos parciales.
16. As an admin, I want que la devolucion exija motivo, so that exista justificacion operativa.
17. As an admin, I want que el importe devuelto sea igual al total neto de la venta, so that no haya diferencias manuales en V1.
18. As an admin, I want que una devolucion no modifique caja cerrada, so that el cierre historico se conserve intacto.
19. As an admin, I want que una venta con caja abierta use anulacion y no devolucion, so that las correcciones inmediatas sigan el flujo POS correcto.
20. As an admin, I want que una venta con factura activa bloquee devolucion, so that primero se corrija el documento fiscal preparado.
21. As an admin, I want que una venta con factura cancelada pueda devolverse, so that el flujo administrativo quede desbloqueado despues de anular factura.
22. As an admin, I want que una venta ya devuelta no pueda devolverse otra vez, so that no se duplique stock ni dinero.
23. As an admin, I want que una venta devuelta cambie a estado `returned`, so that el estado sea visible en listados y comprobantes.
24. As an admin, I want que el pago de una venta devuelta quede `refunded`, so that reportes no mezclen anulacion con devolucion.
25. As an inventory manager, I want que la devolucion reponga los mismos lotes consumidos, so that la trazabilidad farmaceutica sea consistente.
26. As an inventory manager, I want movimientos `sale_returned`, so that el kardex diferencie devolucion administrativa de anulacion POS.
27. As an inventory manager, I want snapshot de cantidades devueltas por lote, so that la devolucion pueda auditarse aunque cambien relaciones futuras.
28. As an auditor, I want que el comprobante interno siga visible cuando la venta esta devuelta, so that exista evidencia historica completa.
29. As an auditor, I want que el comprobante muestre estado devuelto, so that nadie interprete la venta como vigente.
30. As a superadmin, I want consultar auditoria con filtros, so that pueda investigar eventos sensibles.
31. As a superadmin, I want ver metadata completa de auditoria, so that pueda revisar antes y despues de cambios relevantes.
32. As a superadmin, I want auditoria paginada, so that el listado siga usable con volumen alto.
33. As an admin, I want ver reporte de ventas diarias, so that pueda comparar ventas brutas, anulaciones, devoluciones y neto.
34. As an admin, I want que ventas netas resten devoluciones, so that la lectura comercial refleje operaciones vigentes.
35. As an admin, I want que el reporte diferencie anulaciones de devoluciones, so that caja abierta y devolucion administrativa no se mezclen.
36. As an admin, I want ver cantidad de ventas, anulaciones y devoluciones, so that pueda medir actividad operativa.
37. As an admin, I want ver valuacion de inventario por costo real de lote, so that conozca valor disponible.
38. As an admin, I want detalle expandible por lote en valuacion, so that pueda justificar el total por vencimiento y costo.
39. As an admin, I want excluir lotes agotados o cancelados de valuacion, so that el valor no incluya stock no disponible.
40. As an admin, I want ver productos proximos a vencer con parametro de dias, so that pueda ajustar el horizonte operativo.
41. As an admin, I want que vencimientos usen 30 dias por defecto, so that el reporte sea util sin configuracion adicional.
42. As an admin, I want reportes con cortes diarios en zona horaria de Bolivia, so that las fechas coincidan con operacion local.
43. As an admin, I want exportar ventas CSV con filtros de fecha, so that pueda conciliar en Excel.
44. As an admin, I want exportar movimientos de inventario CSV con filtros de fecha, so that pueda analizar kardex fuera del sistema.
45. As an admin, I want CSV con separador punto y coma, so that Windows y Excel regional lo abran correctamente.
46. As an auditor, I want que exportar CSV genere auditoria, so that la extraccion de datos sensibles quede registrada.
47. As an auditor, I want que consultar reportes visuales no genere ruido de auditoria, so that el log conserve eventos realmente sensibles.
48. As an admin, I want paginas separadas para facturas, devoluciones, reportes y exportaciones, so that cada flujo tenga foco operativo.
49. As an admin, I want una entrada visible para devoluciones, so that el flujo no dependa de rutas ocultas.
50. As a superadmin, I want que la navegacion respete permisos, so that seller no vea superficies administrativas.
51. As an admin, I want errores claros cuando una venta no es facturable o devolvible, so that pueda corregir el paso necesario.
52. As an admin, I want anular factura antes de devolucion cuando corresponda, so that el orden administrativo quede controlado.
53. As an admin, I want filtros y paginacion en facturas y devoluciones, so that pueda operar con historial creciente.
54. As a developer, I want contratos compartidos para facturas, devoluciones, reportes, auditoria y exportaciones, so that backend y frontend validen la misma forma de datos.
55. As a developer, I want operaciones transaccionales para devolucion, so that venta, pago, inventario, movimientos y auditoria cambien juntos.
56. As a developer, I want pruebas automatizadas de reglas criticas, so that el cierre administrativo no rompa POS, FEFO ni caja.
57. As a thesis reviewer, I want evidencia funcional del cierre administrativo, so that el caso de estudio cubra el ciclo completo de venta, devolucion, auditoria y reporte.

## Implementation Decisions

- La implementacion se divide en sub-entregas planificadas por PRD/epic antes de ejecutar sprints: persistencia y contratos, backend de dominio, frontend administrativo, y cierre documental.
- Se permite una migracion destructiva para este alcance porque se asume que no hay usuarios activos ni datos productivos que preservar.
- La factura preparada vive separada de la venta y usa correlativo interno propio recomendado `INV-000001`.
- Los estados de factura V1 son `prepared` y `cancelled`.
- La factura se genera solo desde ventas confirmadas vigentes, no anuladas, no devueltas y sin factura activa.
- Una factura cancelada no bloquea crear una nueva factura preparada para la misma venta vigente.
- La factura guarda snapshot de venta, vendedor, fecha, total, items y datos fiscales minimos.
- Si no se ingresan datos fiscales, se guarda `customerNit` como `0` y `customerBusinessName` como `Consumidor final`.
- La cancelacion de factura exige motivo de 5 a 500 caracteres.
- Solo `admin` y `superadmin` pueden crear o cancelar facturas.
- `seller` no puede operar facturacion preparada.
- La devolucion V1 es total, no parcial.
- La devolucion total crea una entidad unica por venta y bloquea doble devolucion.
- La devolucion solo aplica a ventas confirmadas vigentes que ya no deben resolverse por anulacion POS.
- Si la caja asociada sigue abierta y la venta es anulable, se bloquea devolucion y se usa anulacion.
- Si existe factura `prepared`, se bloquea devolucion hasta cancelar factura.
- Si la factura esta `cancelled`, la devolucion queda permitida si las demas reglas se cumplen.
- La devolucion marca la venta como `returned`.
- La devolucion marca el pago como `refunded`.
- La devolucion registra `refundAmount` igual al total neto de la venta.
- La devolucion no modifica ni reabre caja cerrada.
- La devolucion repone inventario a los mismos lotes consumidos por la venta.
- La devolucion genera movimientos de inventario `sale_returned`.
- La devolucion guarda detalle por item/lote con cantidad, costo base y movimiento asociado.
- La devolucion exige motivo de 5 a 500 caracteres.
- Solo `admin` y `superadmin` pueden registrar devoluciones.
- El comprobante interno de venta sigue visible para ventas `returned`, mostrando estado devuelto y referencia de devolucion.
- La auditoria consultable queda limitada a `superadmin`.
- El listado de auditoria incluye resumen y metadata completa, con paginacion.
- Facturas, devoluciones y auditoria usan orden descendente por fecha de creacion.
- Reportes y filtros diarios interpretan rangos en `America/La_Paz`.
- Rango por defecto de ventas diarias: dia actual.
- Valuacion de inventario usa estado actual y costo real por lote disponible.
- Productos proximos a vencer aceptan parametro `days`, con default 30.
- Exportaciones CSV respetan filtros basicos por query params.
- `sales.csv` usa una fila por venta.
- `inventory-movements.csv` usa una fila por movimiento.
- CSV usa separador punto y coma y fechas ISO.
- Descargar CSV genera auditoria; consultar reportes visuales no genera auditoria.
- La navegacion agrega devoluciones como superficie administrativa para `admin` y `superadmin`.
- Las pantallas administrativas siguen el flujo `page -> module hook/facade -> store/api`.
- Los modulos de datos frontend no contienen componentes, copy visible, rutas, iconos ni estilos.
- Las reglas de dominio viven en servicios backend, con acceso a datos encapsulado y transacciones explicitas para devoluciones.
- La documentacion OpenAPI queda actualizada para las superficies del cierre administrativo V1.
- La documentacion operativa de usuario queda actualizada sin describir estructura interna.

## Testing Decisions

- Las pruebas deben validar comportamiento externo y reglas de dominio, no detalles internos.
- Se incluyen pruebas automatizadas como parte de la implementacion; no se planifica QA manual salvo solicitud explicita.
- Las pruebas backend prioritarias cubren facturacion preparada desde venta elegible, bloqueo por venta anulada, bloqueo por venta devuelta y bloqueo por factura activa.
- Las pruebas backend cubren cancelacion de factura con motivo, historial de facturas canceladas y nueva factura sobre venta vigente.
- Las pruebas backend cubren devolucion total, bloqueo de doble devolucion, bloqueo cuando corresponde anulacion POS, reposicion de lotes originales, pago `refunded`, venta `returned` y movimientos `sale_returned`.
- Las pruebas backend cubren reportes netos: ventas brutas, anulaciones, devoluciones y ventas netas.
- Las pruebas backend cubren valuacion por lote disponible y productos proximos a vencer con parametro `days`.
- Las pruebas backend cubren exportaciones CSV con filtros, separador punto y coma y auditoria de descarga.
- Las pruebas frontend mas utiles son de facades, stores y hooks para estados de carga, vacio, error, filtros y mutaciones administrativas.
- Las pantallas deben cubrir errores esperados: venta no facturable, factura activa bloqueando devolucion, venta ya devuelta, motivo invalido y permisos insuficientes.
- La prioridad de pruebas sigue el precedente existente: services con repositories falsos para reglas de negocio y repositories con base de datos de prueba cuando la consulta sea critica.

## Epic Breakdown

Epic principal: `facturacion-devoluciones-auditoria-reportes`

Objetivo del epic: cerrar el ciclo administrativo posterior a ventas POS con factura preparada, devolucion total, auditoria consultable, reportes operativos y exportaciones CSV.

Resultado esperado: `admin` y `superadmin` pueden preparar y cancelar facturas, registrar devoluciones totales permitidas, consultar reportes y descargar CSV; `superadmin` puede consultar auditoria; `seller` queda fuera de superficies administrativas.

Estado de reconciliacion: los sprints 01 a 06 dejaron disponible el cierre administrativo V1 y el sprint 07 completo el cierre documental e infraestructura. El epic queda formalmente en `DONE`.

Secuencia ejecutada:

1. `INFRA/BACKEND` - Persistencia destructiva permitida, estados nuevos, contratos compartidos y documentacion base para facturas, devoluciones, auditoria, reportes y exportaciones.
2. `BACKEND` - Facturacion preparada: creacion desde venta elegible, cancelacion, filtros, permisos, auditoria y bloqueo de estados invalidos.
3. `BACKEND` - Devolucion total: reglas de elegibilidad, transaccion, reposicion por lote, pago `refunded`, venta `returned`, movimientos `sale_returned` y auditoria.
4. `BACKEND` - Auditoria consultable, reportes iniciales y exportaciones CSV con filtros, paginacion y auditoria de descargas.
5. `UI` - Pantallas administrativas para facturas y devoluciones, con filtros, acciones, modales de motivo y errores claros.
6. `UI` - Pantallas de reportes, exportaciones y auditoria, integradas a navegacion y permisos visibles.
7. `INFRA` - OpenAPI, documentacion operativa, evidencia academica y limpieza de referencias.

Evidencia por sprint:

- Sprint 01: base de persistencia, estados, contratos compartidos y OpenAPI inicial.
- Sprint 02: facturacion preparada interna ejecutable con permisos, cancelacion y auditoria.
- Sprint 03: devolucion administrativa total con reposicion por lote, pago reembolsado, venta devuelta y auditoria.
- Sprint 04: auditoria consultable, reportes operativos y exportaciones CSV auditadas.
- Sprint 05: superficies administrativas de facturas preparadas y devoluciones totales.
- Sprint 06: superficies de reportes, exportaciones y auditoria consultable.
- Sprint 07: cierre documental, evidencia academica, reconciliacion de registros, limpieza y guardrails finales.

Dependencias:

- Ventas POS confirmadas con comprobante interno, items, pagos y consumo por lote.
- Anulacion POS ya separada de devolucion administrativa.
- Inventario por lote y movimientos como fuente de trazabilidad.
- Roles base `seller`, `admin` y `superadmin`.
- Auditoria existente como registro de eventos sensibles.

## Out of Scope

- Integracion SIAT real.
- Emision fiscal en linea.
- QR fiscal.
- Renovacion CUIS/CUFD.
- Notas fiscales complejas.
- Devoluciones parciales.
- Reapertura de caja cerrada.
- Impacto directo de devoluciones sobre sesiones de caja cerradas.
- Cuentas por cobrar o cuentas por pagar.
- Pago a proveedor o devolucion a proveedor.
- Reportes BI avanzados.
- Data warehouse.
- Exportacion por item vendido en archivo separado.
- Auditoria de cada consulta visual de reporte.
- QA manual salvo solicitud explicita.

## Further Notes

- La correccion del usuario para este PRD cierra dos supuestos: el alcance debe dividirse con `$to-prd` antes de sprinting, y la migracion puede ser destructiva porque no hay usuarios activos.
- La pregunta sobre tests automatizados no queda como bloqueo: se asume que deben incluirse por criticidad del dominio, sin ejecutar QA manual salvo pedido.
- El chunk 10 depende de que facturacion preparada no se presente como SIAT real. El lenguaje de UI y docs debe mantener esa separacion.
- La devolucion total reduce complejidad V1 y evita reglas de cantidad parcial, reparto parcial y reembolso manual.
- El sprint final de documentacion es necesario porque el usuario final necesitara entender diferencia entre anulacion POS, devolucion administrativa, comprobante interno y factura preparada.
- Las limitaciones V1 reconciliadas permanecen fuera de alcance de forma deliberada: sin SIAT real, sin devoluciones parciales, sin reapertura de caja cerrada y sin BI avanzado.
