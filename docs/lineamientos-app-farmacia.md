# Lineamientos conceptuales del sistema POS para farmacia

## 1. Proposito del sistema

El sistema sera un punto de venta para una farmacia de una sola sucursal, con gestion de inventario, compras, proveedores, ventas, caja, facturacion y reportes analiticos.

El objetivo final no es solo registrar operaciones, sino construir una base confiable para analizar entradas y salidas de productos, margen, rotacion, vencimientos, compras, ventas y comportamiento del inventario.

## 2. Stack recomendado

El stack base sera:

- Backend: Node.js con Express.
- Frontend: React con Tailwind CSS y shadcn/ui.
- Base de datos: PostgreSQL.
- ORM: Prisma.
- Modelos compartidos: TypeScript y Zod en `packages`.

La recomendacion principal es usar PostgreSQL porque el dominio requiere consistencia transaccional, relaciones claras, integridad referencial, auditoria, reportes y consultas analiticas. Inventario por lote, facturacion, compras, ventas, devoluciones y movimientos de stock son procesos naturalmente relacionales.

Prisma se recomienda por su buena experiencia con TypeScript, migraciones, tipado fuerte y productividad en proyectos academicos y profesionales. Zod se recomienda para definir contratos y validaciones compartidas entre frontend y backend.

## 3. Alcance operativo

El sistema se disena para una sola sucursal. No se incluira soporte multi-sucursal en la primera version.

El sistema debe soportar:

- Productos medicinales.
- Productos de venta libre.
- Insumos medicos, como barbijos, gasas, jeringas y material de curacion.
- Productos de higiene o desinfeccion relacionados con farmacia, como alcohol o gel antibacterial.
- Otros productos relacionados directamente con la actividad farmaceutica.

Quedan fuera del alcance:

- Productos de micromercado.
- Snacks.
- Bebidas energeticas.
- Abarrotes.
- Cosmeticos, si la farmacia no los comercializara.
- Alimentos de consumo general.

La normativa boliviana revisada permite que las farmacias vendan medicamentos y productos relacionados con propiedades profilacticas, desinfectantes, higienicas y de uso corporal, pero prohibe articulos no relacionados con el expendio farmaceutico. Por eso el sistema debe permitir productos no medicinales solo cuando esten relacionados con farmacia y salud.

Referencias normativas consultadas:

- DS 25235, Reglamento a la Ley del Medicamento: https://www.lexivox.org/norms/BO-DS-25235.html
- Reglamento de Farmacias y Laboratorios, articulos sobre alcance de productos y prohibiciones: https://bolivia.infoleyes.com/norma/3406/reglamento-de-farmacias-y-laboratorios-rfl
- AGEMED / Ley del Medicamento, ambito regulado: https://www.gob.bo/entidades/agencia-estatal-de-medicamentos-y-tecnologias-en-salud

## 4. Modulos funcionales principales

El sistema se organizara conceptualmente en los siguientes modulos:

- Autenticacion y usuarios.
- Roles y permisos.
- Catalogo de productos.
- Unidades de medida y conversiones.
- Proveedores.
- Compras.
- Inventario por lote.
- Movimientos de inventario.
- Ventas POS.
- Caja y pagos.
- Facturacion SIAT.
- Devoluciones y anulaciones.
- Auditoria.
- Alertas.
- Reportes.
- Exportacion CSV.
- Modelos compartidos entre frontend y backend.

## 5. Roles y permisos

### Superadmin

Responsable de la administracion completa del sistema.

Permisos principales:

- Gestionar usuarios.
- Gestionar roles y permisos.
- Configurar parametros globales.
- Configurar parametros de facturacion SIAT.
- Acceder a auditoria completa.
- Gestionar catalogos criticos.
- Anular facturas.
- Acceder a todos los reportes.
- Realizar operaciones administrativas sensibles.

### Admin

Responsable de la operacion administrativa de la farmacia.

Permisos principales:

- Gestionar productos.
- Gestionar proveedores.
- Registrar y recibir compras.
- Gestionar inventario.
- Realizar ajustes manuales de inventario.
- Autorizar devoluciones controladas.
- Anular facturas.
- Acceder a reportes.
- Revisar alertas.
- Supervisar caja.

### Vendedor

Responsable de la atencion y cobro en el POS.

Permisos principales:

- Registrar ventas.
- Consultar productos y stock.
- Cobrar ventas.
- Emitir factura.
- Abrir y cerrar caja si aplica.
- Registrar pagos en efectivo.
- Consultar alertas operativas basicas.

Restricciones:

- No puede anular facturas.
- No puede modificar costos.
- No puede realizar ajustes manuales de inventario.
- No puede modificar configuracion SIAT.
- No puede crear usuarios ni cambiar roles.

## 6. Productos

El catalogo de productos debe permitir medicamentos y productos relacionados con farmacia.

Campos conceptuales principales:

- Identificador.
- Codigo interno.
- Codigo de barras.
- Nombre comercial.
- Nombre generico, cuando aplique.
- Descripcion.
- Tipo de producto.
- Categoria.
- Laboratorio o marca.
- Registro sanitario, cuando aplique.
- Indicador de medicamento.
- Indicador de venta libre.
- Indicador de receta requerida.
- Indicador de lote requerido.
- Indicador de vencimiento requerido.
- Unidad base de inventario.
- Estado activo/inactivo.
- Stock minimo.
- Precio de venta por presentacion.

Tipos conceptuales de producto:

- Medicamento.
- Venta libre.
- Insumo medico.
- Higiene y desinfeccion.
- Miscelaneo farmaceutico relacionado.

Aunque el sistema permitira banderas configurables, la regla de negocio definida para la farmacia es exigir lote y vencimiento para todos los productos registrados en inventario.

## 7. Unidades de medida y conversiones

El sistema debe manejar unidades de medida y conversiones por producto.

Cada producto tendra una unidad base para controlar inventario. Las compras y ventas podran registrarse en unidades comerciales equivalentes.

Ejemplo:

- Unidad base: tableta.
- 1 blister = 10 tabletas.
- 1 caja = 100 tabletas.

Si se compra 1 caja, el inventario suma 100 tabletas. Si se vende 1 blister, el inventario descuenta 10 tabletas.

Este modelo evita ambiguedades y permite analizar correctamente entradas, salidas, costos y margenes.

## 8. Inventario por lote

El inventario se gestionara por producto, lote y fecha de vencimiento.

Cada lote debe contener:

- Producto.
- Numero de lote.
- Fecha de vencimiento.
- Cantidad disponible en unidad base.
- Costo unitario en unidad base.
- Fecha de ingreso.
- Compra de origen, cuando aplique.
- Estado del lote.

El costo de inventario sera por lote, no un costo promedio global. Esto permite calcular margen real segun el lote vendido y valorar correctamente el inventario.

## 9. Metodo de salida FEFO

El metodo de salida recomendado y aceptado es FEFO: first expired, first out.

Esto significa que el sistema debe descontar primero los lotes con fecha de vencimiento mas cercana, siempre que tengan stock disponible y no esten vencidos o bloqueados.

FEFO es especialmente importante en farmacia porque reduce perdidas por vencimiento y mejora la trazabilidad.

## 10. Movimientos de inventario

La tabla conceptual mas importante para analisis sera `inventory_movements`.

Todo cambio de stock debe generar un movimiento:

- Compra recibida.
- Venta.
- Devolucion.
- Ajuste manual.
- Anulacion.
- Merma.
- Vencimiento.
- Correccion.

Cada movimiento debe registrar:

- Producto.
- Lote.
- Tipo de movimiento.
- Cantidad en unidad base.
- Costo unitario, cuando aplique.
- Referencia al documento origen.
- Usuario responsable.
- Fecha y hora.
- Motivo.

Esta tabla sera la base para analizar entradas, salidas, rotacion, stock, margen e inventario valorizado.

## 11. Compras y proveedores

El sistema debe manejar proveedores y compras formalmente.

Una compra puede estar en estado:

- Borrador.
- Recibida.
- Anulada.

Una compra en borrador no modifica inventario. Una compra recibida genera lotes y movimientos de entrada. Una compra anulada debe conservarse para auditoria.

Datos conceptuales de proveedor:

- Nombre o razon social.
- NIT.
- Telefono.
- Direccion.
- Contacto.
- Estado.

Datos conceptuales de compra:

- Proveedor.
- Fecha.
- Estado.
- Numero de documento.
- Total.
- Usuario creador.
- Usuario receptor.
- Observaciones.

Detalle de compra:

- Producto.
- Unidad de compra.
- Cantidad comprada.
- Conversion a unidad base.
- Cantidad en unidad base.
- Costo unitario.
- Numero de lote.
- Fecha de vencimiento.

## 12. Ventas POS

La venta sera pagada al momento. No se incluira credito ni cuentas por cobrar.

Una venta debe registrar:

- Usuario vendedor.
- Fecha y hora.
- Estado.
- Subtotal.
- Descuentos, si se habilitan.
- Total.
- Datos de facturacion.
- Relacion con factura.
- Relacion con pago.

Detalle de venta:

- Producto.
- Lote descontado.
- Unidad vendida.
- Cantidad vendida.
- Conversion a unidad base.
- Precio unitario.
- Costo unitario del lote.
- Subtotal.
- Margen calculado.

El vendedor atiende y cobra. No se requiere separar roles de cajero y vendedor.

## 13. Caja y pagos

El sistema tendra caja simple.

En V1 se usara pago en efectivo. El modelo debe quedar preparado para soportar QR boliviano en una fase posterior.

Metodos de pago conceptuales:

- Efectivo.
- QR.
- Tarjeta.
- Transferencia.

QR queda previsto como metodo futuro, sin integracion inicial.

La caja debe permitir:

- Apertura.
- Cierre.
- Monto inicial.
- Total esperado.
- Monto contado.
- Diferencia.
- Usuario responsable.
- Estado abierta/cerrada.

Los pagos deben relacionarse con ventas y caja.

## 14. Facturacion SIAT Bolivia

El sistema debe contemplar facturacion integrada con el sistema tributario boliviano SIAT.

La recomendacion conceptual para V1 es apuntar a Facturacion Computarizada en Linea. La integracion puede quedar preparada si el tiempo del proyecto no permite completarla.

La facturacion no debe mezclarse como simples campos dentro de ventas. Debe existir un modulo fiscal separado.

Conceptos principales:

- Configuracion tributaria.
- CUIS.
- CUFD.
- Punto de venta.
- Actividad economica.
- Leyenda.
- Documento sector.
- Factura.
- XML generado.
- Estado de envio.
- Respuesta del SIN.
- Codigo de recepcion.
- Errores SIAT.
- Anulacion de factura.
- Contingencia.

Estados conceptuales de factura:

- Borrador.
- Emitida.
- Enviada.
- Validada.
- Rechazada.
- Observada.
- Anulada.

Solo `admin` y `superadmin` pueden anular facturas.

La venta y la factura deben relacionarse, pero no ser la misma entidad. La venta representa la operacion comercial e inventario. La factura representa el documento fiscal.

Referencias SIAT consultadas:

- Facturacion Electronica en Linea: https://siatanexo.impuestos.gob.bo/index.php/modalidades-facturacion/facturacion-electronica
- Facturacion Computarizada en Linea: https://siatanexo.impuestos.gob.bo/index.php/modalidades-facturacion/facturacion-computarizada
- Componentes del Sistema de Facturacion Virtual en Linea: https://siatanexo.impuestos.gob.bo/index.php/requerimientos/componentes-sfvl
- Codigos de error SIAT: https://siatinfo.impuestos.gob.bo/index.php/facturacion-en-linea/implementacion-servicios-facturacion/codigos-error-siat

## 15. Devoluciones y anulaciones

El sistema debe permitir devoluciones controladas.

Una devolucion debe registrar:

- Venta original.
- Productos devueltos.
- Lotes involucrados.
- Motivo.
- Usuario que registra.
- Usuario que autoriza.
- Impacto en inventario.
- Impacto en caja.
- Impacto fiscal, si la venta fue facturada.

Las devoluciones no deben ser libres. En farmacia deben manejarse con cuidado por razones sanitarias, fiscales y de trazabilidad.

Se distinguen dos acciones:

- Anular venta interna: aplica antes de consolidacion fiscal o bajo reglas controladas.
- Anular factura: accion fiscal ante SIAT, restringida a `admin` y `superadmin`.

## 16. Ajustes manuales de inventario

Los ajustes manuales se permiten solo para `admin` y `superadmin`.

Motivos conceptuales:

- Conteo fisico.
- Vencimiento.
- Merma.
- Producto danado.
- Correccion de lote.
- Devolucion.
- Error operativo.
- Otro.

Todo ajuste debe generar:

- Movimiento de inventario.
- Registro de auditoria.
- Usuario responsable.
- Motivo obligatorio.
- Estado anterior y nuevo estado.

## 17. Auditoria

El sistema debe tener auditoria completa para acciones importantes.

Eventos auditables:

- Inicio de sesion.
- Creacion o modificacion de usuarios.
- Cambios de roles.
- Creacion o modificacion de productos.
- Cambios de precio.
- Cambios de costo.
- Registro y recepcion de compras.
- Ajustes de inventario.
- Ventas.
- Devoluciones.
- Anulaciones.
- Emision y anulacion de facturas.
- Cambios de configuracion SIAT.
- Errores o respuestas relevantes del SIAT.

Cada auditoria debe registrar:

- Usuario.
- Accion.
- Entidad afectada.
- Identificador de entidad.
- Datos anteriores.
- Datos nuevos.
- Fecha y hora.
- Metadata tecnica.

## 18. Alertas automaticas

El sistema debe incluir alertas operativas.

Alertas recomendadas:

- Stock bajo.
- Producto agotado.
- Lote proximo a vencer.
- Lote vencido.
- Compra en borrador pendiente.
- Factura rechazada por SIAT.
- CUFD no disponible o proximo a vencer.
- Caja abierta sin cerrar.
- Producto sin precio de venta.
- Producto sin registro sanitario cuando aplique.

Estas alertas deben alimentar el dashboard y los reportes operativos.

## 19. Reportes y analisis de datos

El analisis inicial se hara con PostgreSQL y vistas analiticas.

No se implementara un data warehouse desde el inicio. La estructura transaccional debe ser limpia para permitir consultas, vistas y exportaciones confiables.

Reportes iniciales:

- Ventas diarias.
- Ventas por producto.
- Ventas por categoria.
- Margen por producto.
- Margen por lote.
- Rotacion de inventario.
- Stock actual por lote.
- Inventario valorizado.
- Productos proximos a vencer.
- Productos vencidos.
- Compras por proveedor.
- Entradas y salidas por periodo.
- Anulaciones.
- Devoluciones.
- Facturas por estado SIAT.
- Diferencias de caja.

La base del analisis sera `inventory_movements`, complementada con ventas, compras, lotes, pagos y facturas.

## 20. Exportacion CSV

El sistema debe permitir exportar reportes a CSV para analisis externo con pandas u otras librerias.

Recomendaciones para CSV:

- Fechas en formato ISO.
- IDs estables.
- Cantidades normalizadas a unidad base.
- Columnas separadas para precio, costo, margen e impuestos.
- Nombres descriptivos.
- Sin mezclar valores numericos con texto.
- Incluir estado de documentos.
- Incluir lote y vencimiento cuando aplique.

Exportaciones recomendadas:

- Movimientos de inventario.
- Ventas.
- Detalle de ventas.
- Compras.
- Detalle de compras.
- Stock por lote.
- Productos.
- Facturas SIAT.
- Devoluciones.
- Caja y pagos.

## 21. Modelos compartidos

Los modelos y validaciones compartidas viviran conceptualmente en `packages`.

El objetivo es que frontend y backend usen contratos comunes para:

- Productos.
- Compras.
- Ventas.
- Usuarios.
- Roles.
- Inventario.
- Facturacion.
- Reportes.

La recomendacion es definir schemas con Zod y derivar tipos TypeScript desde ellos. Esto evita duplicar validaciones y reduce inconsistencias entre formularios, API y reglas de negocio.

El detalle de estructura de carpetas del monorepo queda fuera de este documento y se definira en otra sesion.

## 22. Esquema conceptual principal

Entidades principales:

- users
- roles
- permissions
- products
- product_categories
- units
- product_units
- suppliers
- purchases
- purchase_items
- inventory_batches
- inventory_movements
- inventory_adjustments
- sales
- sale_items
- sale_returns
- sale_return_items
- cash_sessions
- payments
- invoices
- siat_configurations
- siat_cuis
- siat_cufd
- siat_events
- audit_logs
- alerts

Relaciones clave:

- Un usuario pertenece a un rol.
- Un producto pertenece a una categoria.
- Un producto tiene una unidad base.
- Un producto puede tener varias unidades equivalentes.
- Un proveedor tiene muchas compras.
- Una compra tiene muchos items.
- Una compra recibida genera lotes.
- Un lote pertenece a un producto.
- Una venta tiene muchos items.
- Cada item de venta descuenta uno o mas lotes segun FEFO.
- Toda entrada o salida genera movimientos de inventario.
- Una venta tiene pagos.
- Una venta puede tener una factura.
- Una factura tiene estados y respuestas SIAT.
- Las devoluciones se relacionan con ventas originales.
- Las acciones importantes generan auditoria.

## 23. Decisiones aceptadas

- La farmacia sera de una sola sucursal.
- Se usara PostgreSQL.
- Se usara Prisma.
- Se usara Node.js con Express.
- Se usara React con Tailwind CSS y shadcn/ui.
- Se compartiran modelos con TypeScript y Zod en `packages`.
- El inventario sera por producto, lote y vencimiento.
- Se usaran unidades de medida y conversiones.
- Se usara costo por lote.
- Se usara metodo FEFO.
- Se manejaran compras y proveedores.
- Las compras tendran estados borrador, recibida y anulada.
- Se tendra caja simple.
- En V1 el pago sera en efectivo.
- QR queda previsto para una fase posterior.
- No se manejara credito a clientes.
- No se manejara modulo de pacientes.
- Si se manejara facturacion.
- La facturacion se disena para integracion SIAT Bolivia.
- La recomendacion fiscal base es Facturacion Computarizada en Linea.
- La integracion SIAT puede quedar preparada si no se completa en V1.
- Se permitiran productos no medicinales relacionados con farmacia y salud.
- Se exigira lote y vencimiento para los productos de inventario.
- El vendedor no puede anular facturas.
- Solo admin y superadmin pueden anular facturas.
- Se tendra auditoria completa.
- Se permitiran ajustes manuales solo a admin y superadmin.
- Se permitiran devoluciones controladas.
- Se incluiran alertas automaticas.
- El analisis iniciara con PostgreSQL y vistas analiticas.
- Se exportaran datos a CSV para analisis con pandas u otras herramientas.

## 24. Fuera de alcance inicial

Queda fuera del alcance conceptual inicial:

- Multi-sucursal.
- Data warehouse.
- Credito a clientes.
- Cuentas por cobrar.
- Modulo de pacientes.
- Historial clinico.
- Integracion QR completa.
- Venta de productos de micromercado.
- Estructura detallada de carpetas.
- Diseno visual del frontend.
- Implementacion tecnica de endpoints.

## 25. Criterio rector

El sistema debe priorizar trazabilidad, consistencia y capacidad analitica.

Cada venta, compra, ajuste, devolucion y anulacion debe dejar evidencia suficiente para responder:

- Que producto se movio.
- En que cantidad.
- En que unidad.
- Desde que lote.
- A que costo.
- A que precio.
- Quien realizo la accion.
- Cuando ocurrio.
- Por que ocurrio.
- Que impacto tuvo en inventario, caja, facturacion y reportes.

Este criterio debe guiar las decisiones futuras de diseno e implementacion.
