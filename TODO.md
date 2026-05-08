# TODO - Catalogos base, productos y unidades

## Base de datos

- [ ] Ejecutar migracion `20260508203000_add_product_catalogs`.
- [ ] Ejecutar `prisma generate` despues de la migracion.
- [ ] Cargar seed para permisos de catalogos.

## Backend

- [ ] Validar endpoints con usuario `superadmin` o `admin`.
- [ ] Confirmar que `seller` solo pueda consultar productos, unidades y categorias.
- [ ] Probar errores de codigo interno duplicado, codigo de barras duplicado, unidad duplicada y categoria duplicada.
- [ ] Revisar registros `audit_logs` para creacion/edicion de producto y cambios de conversiones.
- [ ] Completar documentacion OpenAPI detallada para los nuevos endpoints.

## Frontend

- [ ] Validar `/units` en escritorio y movil.
- [ ] Validar `/products` en escritorio y movil.
- [ ] Probar estados vacios, carga y error de conexion.
- [ ] Confirmar que los controles de escritura queden bloqueados para `seller`.
- [ ] Revisar textos finales con cliente/usuario de farmacia.

## Prueba manual de cierre

- [ ] Crear categoria de medicamento.
- [ ] Crear unidad base, por ejemplo `Tableta`.
- [ ] Crear unidad comercial, por ejemplo `Caja`.
- [ ] Crear producto inventariable con lote y vencimiento obligatorios.
- [ ] Editar precio de venta y verificar auditoria.
- [ ] Configurar conversion `Caja -> Tableta`.

## Fuera de alcance de este modulo

- [ ] Stock real por lote.
- [ ] Compras recibidas.
- [ ] Movimientos de inventario.
- [ ] Ventas POS.
- [ ] Imagenes de producto.
- [ ] Importacion masiva.
