# TODO - Catalogos base, productos y unidades

## Base de datos

- [ ] Ejecutar migracion `20260508203000_add_product_catalogs`.
- [ ] Ejecutar `prisma generate` despues de la migracion.
- [ ] Cargar seed para permisos de catalogos.

## Backend

- [ ] Validar endpoints con usuario `superadmin` o `admin`.
- [ ] Confirmar que `seller` solo pueda consultar productos, unidades y categorias.
- [ ] Probar errores de codigo interno duplicado, codigo de barras duplicado, unidad duplicada y categoria duplicada.
- [ ] Revisar registros `audit_logs` para creacion/edicion de producto.
- [ ] Completar documentacion OpenAPI detallada para los nuevos endpoints.

## Frontend

- [ ] Validar `/units` en escritorio y movil.
- [ ] Validar `/products` en escritorio y movil.
- [ ] Probar estados vacios, carga y error de conexion.
- [ ] Confirmar que los controles de escritura queden bloqueados para `seller`.
- [ ] Revisar textos finales con cliente/usuario de farmacia.

## Prueba manual de cierre

- [ ] Crear categoria de medicamento.
- [ ] Crear unidad de producto, por ejemplo `Blister`, `Tableta`, `Frasco` o `Caja`, segun como se vendera y controlara en farmacia.
- [ ] Crear producto inventariable con lote y vencimiento obligatorios.
- [ ] Editar precio de venta y verificar auditoria.
- [ ] Confirmar que el producto opere con una sola unidad de producto, sin exigir conversion a unidad minima.

## TODO detallado - Conversiones de unidades

- [ ] Pausar el uso operativo de conversiones hasta definir un flujo mas intuitivo para farmacia.
- [ ] Mientras esta decision siga vigente, manejar productos solo por unidad de producto seleccionada por el usuario. Ejemplos:
  - `Blister` como unidad de producto cuando la farmacia vende y controla blisters completos.
  - `Caja` como unidad de producto cuando el control operativo se realiza por cajas.
  - `Frasco`, `Ampolla`, `Sobre`, `Tubo` o `Unidad` cuando esas sean las presentaciones reales de venta o compra.
- [ ] Evitar que el sistema obligue a convertir cantidades comerciales a fracciones poco intuitivas. Caso detectado: si un blister contiene 10 tabletas y el producto se controla como `Blister`, una venta o movimiento de 1 tableta obligaria a registrar `0.1 blister`, lo cual no es claro para el usuario de farmacia.
- [ ] Revisar el modelo de unidades antes de reactivar conversiones. La solucion futura debe distinguir al menos:
  - unidad operativa usada en pantalla para comprar, vender y ajustar stock;
  - unidad minima fisica, si se decide controlar fracciones internas;
  - presentaciones comerciales equivalentes, solo cuando aporten valor real al flujo.
- [ ] Definir reglas de redondeo y precision antes de permitir fracciones. No aceptar decimales como `0.1 blister` en operaciones normales si el personal espera registrar unidades completas.
- [ ] Definir si una presentacion puede fraccionarse. Ejemplos:
  - blister fraccionable por tableta;
  - caja fraccionable por blister;
  - frasco no fraccionable;
  - ampolla no fraccionable.
- [ ] Ajustar la UX futura para que las conversiones expliquen claramente "contenido por presentacion" en vez de pedir un factor tecnico hacia unidad base.
- [ ] Si se retoman conversiones, mostrar ejemplos contextualizados por producto: `1 blister = 10 tabletas`, `1 caja = 10 blisters`, `1 caja = 100 tabletas`.
- [ ] Evaluar si compras, ventas, kardex, costos y reportes deben guardar snapshots de conversion solo cuando el producto realmente use presentaciones equivalentes.
- [ ] Revisar documentacion operativa y pruebas manuales cuando se reactive este alcance, para no instruir al usuario a configurar conversiones mientras el sistema se maneje por unidad de producto.

## Fuera de alcance de este modulo

- [ ] Stock real por lote.
- [ ] Compras recibidas.
- [ ] Movimientos de inventario.
- [ ] Ventas POS.
- [ ] Imagenes de producto.
- [ ] Importacion masiva.

## Pendientes para SIAT

- [ ] Definir `documentNumber` de compras cuando se implemente SIAT.
- [ ] Validar si el documento del proveedor debe ser obligatorio y unico por proveedor.

## Pendientes detectados en flujo normal de trabajo

- [ ] Implementar pantalla operativa de **Punto de venta**: busqueda de productos, carrito, seleccion FEFO por lote, calculo de totales, registro de venta y emision de comprobante/factura.
- [ ] Implementar **Caja**: apertura, ingresos por venta, pagos, diferencias y cierre diario con responsable.
- [ ] Implementar **Lotes y stock**: consulta real de existencias por lote, vencimiento, costo, estado operativo y cantidad disponible despues de recepciones.
- [ ] Implementar **Movimientos**: trazabilidad de entradas, salidas, ajustes, devoluciones, anulaciones y mermas.
- [ ] Implementar **Ajustes manuales** de inventario con motivo obligatorio, auditoria y efecto controlado en stock.
- [ ] Implementar **Devoluciones y anulaciones** conectadas a ventas, caja, inventario y documentos fiscales.
- [ ] Implementar **Alertas operativas**: stock bajo, lotes proximos a vencer, caja abierta y observaciones SIAT.
- [ ] Implementar **Facturas SIAT**: estado fiscal, respuesta del SIN, validacion, observaciones, contingencia y anulaciones permitidas.
- [ ] Implementar **Configuracion SIAT**: CUIS, CUFD, punto de venta, actividad economica y parametros de contingencia.
- [ ] Implementar **Reportes**: ventas, margen, rotacion, vencimientos, compras y caja.
- [ ] Implementar **Exportaciones CSV** con fechas ISO, IDs estables y filtros operativos.
- [ ] Implementar **Auditoria** consultable por usuario, modulo, accion sensible y rango de fechas.
- [ ] Implementar **Roles y permisos** administrables desde UI; actualmente la navegacion reconoce roles base, pero la pantalla operativa esta pendiente.
- [ ] Implementar **Configuracion** global de parametros de farmacia y operacion.
- [ ] Conectar metricas del **Dashboard** a datos reales de ventas, stock critico, compras abiertas y facturas observadas.
