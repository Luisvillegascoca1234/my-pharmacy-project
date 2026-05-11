## Problem Statement

La farmacia necesita registrar proveedores y compras recibidas de forma confiable para que el inventario por lote nazca desde una operación transaccional auditada. Hoy el catálogo de productos, unidades y conversiones ya existe, pero todavía no hay un flujo que conecte una compra real con stock disponible, costos por lote, movimientos de inventario y trazabilidad administrativa.

El problema principal es que una compra no puede ser solo un formulario comercial: cuando se recibe, debe transformar cantidades comerciales en unidad base, crear capas de inventario con costo real, registrar movimientos de entrada y permitir reversa controlada si la recepción fue marcada por error. Además, el contexto boliviano exige soportar costos variables para un mismo lote físico sin bloquear ventas ni perder margen real.

## Solution

Se implementará un flujo de proveedores y compras recibidas con rutas backend, contratos compartidos, modelos Prisma, stores Zustand y páginas frontend con rutas dedicadas.

El usuario podrá crear y editar proveedores, crear compras en borrador con ítems, guardar el borrador, abrir el detalle por URL, recibir la compra cuando no haya cambios pendientes y anular compras con motivo obligatorio. Una compra recibida generará capas internas de `InventoryBatch` por ítem inventariable y movimientos `InventoryMovement` dentro de una transacción. Las capas permitirán que el mismo producto, número de lote y vencimiento tenga costos distintos por recepción, manteniendo una vista operativa agrupada para inventario futuro.

La lista de proveedores y la lista de compras nacerán paginadas. Las páginas usarán Zustand para manejar listas, filtros, paginación, detalle seleccionado, `draftForm`, `isDirty`, carga, errores y resets por desmontaje.

## User Stories

1. Como admin, quiero registrar un proveedor con razón social, contacto y estado, para usarlo en compras futuras.
2. Como admin, quiero registrar un proveedor sin NIT, para no bloquear proveedores informales o datos incompletos.
3. Como admin, quiero que el NIT sea único cuando exista, para evitar proveedores duplicados.
4. Como admin, quiero listar proveedores con paginación, búsqueda y filtro por estado, para encontrar proveedores sin cargar toda la base.
5. Como admin, quiero abrir `/suppliers/:id`, para consultar o editar un proveedor directamente desde una URL.
6. Como admin, quiero crear proveedores desde `/suppliers/new`, para separar creación y edición.
7. Como admin, quiero desactivar proveedores sin borrar historial, para impedir nuevas compras sin perder compras antiguas.
8. Como admin, quiero reactivar proveedores si corresponde, para corregir una desactivación administrativa.
9. Como admin, quiero crear una compra en `/purchases/new`, para registrar una compra antes de recibirla.
10. Como admin, quiero guardar una compra como `draft` y redirigir a `/purchases/:id`, para continuar el flujo desde una URL estable.
11. Como admin, quiero que una compra exija al menos un ítem, para evitar borradores vacíos sin valor operativo.
12. Como admin, quiero editar proveedor, fecha, notas e ítems mientras la compra esté en `draft`, para corregir errores antes de recibir.
13. Como admin, quiero que una compra `received` o `cancelled` sea de solo lectura, para proteger historial.
14. Como admin, quiero seleccionar solo proveedores activos en nuevas compras, para no comprar a proveedores deshabilitados.
15. Como admin, quiero cambiar el proveedor de una compra en borrador, para corregir errores de carga.
16. Como admin, quiero que la fecha comercial `purchaseDate` sea obligatoria y fecha pura, para reportar compras por día sin errores de zona horaria.
17. Como admin, quiero que `receivedAt` sea fecha/hora del servidor, para que el impacto de inventario sea auditable.
18. Como admin, quiero agregar productos activos a la compra, para no ingresar stock de productos deshabilitados.
19. Como admin, quiero elegir solo unidades configuradas en `ProductUnit` para cada producto, para usar conversiones confiables.
20. Como admin, quiero que el backend tome el `conversionFactor` actual al guardar el borrador, para normalizar cantidades a unidad base.
21. Como admin, quiero que el ítem guarde un snapshot de `conversionFactor`, `baseQuantity`, `baseUnitCost` y `lineTotal`, para preservar el cálculo histórico.
22. Como admin, quiero que el total de compra se calcule en backend, para evitar manipulación o diferencias de redondeo.
23. Como admin, quiero registrar lote y vencimiento en ítems inventariables, para que la recepción pueda crear inventario válido.
24. Como admin, quiero que `batchNumber` se normalice, para evitar duplicados visuales como `abc123` y `ABC123`.
25. Como admin, quiero que `expirationDate` sea fecha pura y no vencida, para evitar recibir stock inutilizable.
26. Como admin, quiero poder incluir ítems no inventariables, para registrar compras administrativas sin afectar stock.
27. Como admin, quiero que ítems no inventariables no exijan lote ni vencimiento, para no inventar datos sanitarios que no aplican.
28. Como admin, quiero evitar ítems duplicados equivalentes dentro de una compra, para mantener detalle claro y auditable.
29. Como admin, quiero permitir costos diferentes para el mismo lote físico, para operar con variación de dólar y costo de reposición.
30. Como admin, quiero que cada ítem inventariable recibido cree una capa `InventoryBatch`, para mantener costo real por recepción.
31. Como admin, quiero que la UI futura pueda agrupar capas por producto, lote y vencimiento, para ver stock operativo total.
32. Como admin, quiero recibir una compra solo cuando no haya cambios pendientes, para que inventario use datos guardados y validados.
33. Como admin, quiero un estado `isDirty` visible en el flujo, para saber cuándo debo guardar antes de recibir.
34. Como admin, quiero que recibir una compra sea transaccional, para que si un ítem falla no se cree inventario parcial.
35. Como admin, quiero que recibir una compra cree movimientos de entrada, para tener kardex y base analítica.
36. Como admin, quiero que la recepción registre auditoría, para saber quién cambió el estado de la compra.
37. Como admin, quiero agregar `receiveNotes` opcional al recibir, para dejar observaciones de entrega sin bloquear operación.
38. Como admin, quiero anular una compra en borrador con motivo, para conservar evidencia administrativa.
39. Como admin, quiero anular una compra recibida si las capas creadas siguen intactas, para corregir una recepción marcada por error.
40. Como admin, quiero que anular una compra recibida cree movimientos inversos, para que el inventario explique la reversa.
41. Como admin, quiero que una capa anulada quede con `availableQuantity = 0` y `status = cancelled`, para no borrar historia.
42. Como admin, quiero que se bloquee la anulación si una capa ya fue consumida, para no romper ventas, caja o trazabilidad.
43. Como admin, quiero listar compras con paginación y filtros, para operar con muchas compras sin degradar la UI.
44. Como admin, quiero filtrar compras por estado, proveedor, rango de fechas y búsqueda, para ubicar compras rápidamente.
45. Como admin, quiero abrir `/purchases/:id`, para revisar o completar una compra desde una URL directa.
46. Como admin, quiero que `GET /api/purchases/:id` devuelva proveedor, usuarios, ítems y estados completos, para renderizar el detalle sin llamadas excesivas.
47. Como admin, quiero que `GET /api/purchases` devuelva resumen paginado, para construir una lista eficiente.
48. Como superadmin, quiero poder hacer las mismas operaciones que admin, para cubrir administración completa.
49. Como seller, no quiero poder gestionar compras o proveedores, para respetar el límite operativo del rol.
50. Como auditor administrativo, quiero ver movimientos y audit logs separados, para distinguir cambios de stock de acciones humanas.
51. Como desarrollador, quiero contratos Zod compartidos para proveedores, compras, ítems, recepción, anulación y paginación, para evitar divergencia entre frontend y backend.
52. Como desarrollador, quiero que los módulos backend conserven capas routes/controllers/services/repositories, para mantener reglas fuera de HTTP y Prisma fuera de controllers.
53. Como desarrollador, quiero que proveedores y compras tengan stores Zustand separados, para aislar ciclos de vida y complejidad.
54. Como desarrollador, quiero que los stores manejen listas, filtros, paginación, detalle, draft, `isDirty`, status y error, para centralizar estado de feature.
55. Como desarrollador, quiero que los stores se reseteen al desmontar cada página, incluso entre lista y detalle, para evitar estados cruzados.
56. Como desarrollador, quiero que la navegación no viva dentro de stores, para mantener `src/modules` portable y sin router.
57. Como desarrollador, quiero que las páginas llamen explícitamente a `load*` al montar, para que la carga sea predecible por ruta.
58. Como desarrollador, quiero actualizar OpenAPI de forma mínima, para que los endpoints nuevos no queden invisibles.

## Implementation Decisions

- Se crearán módulos backend `suppliers`, `purchases` e `inventory` con mini-stack por capas.
- `suppliers` expondrá `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers` y `PATCH /api/suppliers/:id`.
- `purchases` expondrá `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `PATCH /api/purchases/:id`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`.
- La autorización seguirá el patrón actual por rol directo: `superadmin` y `admin` gestionan; `seller` no gestiona.
- No se agregan permisos granulares nuevos en este PRD.
- `Supplier` tendrá `businessName`, `nit`, `phone`, `address`, `contactName`, `status`, timestamps y relación histórica con compras.
- `nit` será opcional, pero único cuando exista.
- `GET /api/suppliers` será paginado con `search`, `status`, `page` y `pageSize`.
- `Purchase` tendrá `supplierId`, `purchaseDate`, `status`, `totalAmount`, `createdByUserId`, `receivedByUserId`, `receivedAt`, `cancelledAt`, `notes`, `receiveNotes` y `cancelReason`.
- `documentNumber` queda fuera de esta implementación y se retomará con SIAT.
- `purchaseDate` y `expirationDate` se manejarán como fechas puras en contratos.
- `createdAt` y `receivedAt` serán fecha/hora de servidor.
- `PurchaseStatus` incluirá `draft`, `received` y `cancelled`.
- `POST /api/purchases` y `PATCH /api/purchases/:id` exigirán al menos un ítem.
- `PATCH /api/purchases/:id` reemplazará encabezado e ítems completos mientras la compra esté en `draft`.
- Compras `received` y `cancelled` no se editan como borrador.
- `totalAmount` se calcula siempre en backend desde ítems.
- Dinero usará 2 decimales. Cantidades, conversiones y costo base usarán 4 decimales.
- Los cálculos críticos se harán con decimal seguro, no con aritmética flotante simple.
- La unidad de compra debe existir en `ProductUnit` del producto.
- `PurchaseItem` guardará snapshot de `conversionFactor`, `baseQuantity`, `baseUnitCost` y `lineTotal`.
- Mientras la compra esté en `draft`, cada guardado recalcula snapshots con la conversión vigente.
- Al recibir, los snapshots quedan congelados.
- Productos inactivos no pueden agregarse a compras nuevas ni recibirse.
- Si una compra en borrador contiene un producto que luego fue desactivado, se puede ver y eliminar ese ítem, pero no recibir hasta resolverlo.
- Ítems inventariables exigirán `batchNumber` y `expirationDate`.
- `batchNumber` se normalizará con trim y uppercase.
- `expirationDate` debe ser igual o posterior al día actual del servidor.
- Ítems no inventariables pueden recibirse sin lote ni vencimiento y no generan inventario.
- Para costos variables, `InventoryBatch` representará una capa interna de inventario, no un lote físico único.
- Cada `PurchaseItem` inventariable recibido creará exactamente una capa `InventoryBatch`.
- La vista operativa de stock futura agrupará por producto, `batchNumber` y `expirationDate`.
- `InventoryBatch` tendrá `active`, `depleted` y `cancelled`.
- Recepción crea `InventoryMovement` de tipo `purchase_received` con cantidad positiva.
- Anulación de recepción crea `InventoryMovement` de tipo `purchase_cancelled` con cantidad negativa.
- `InventoryMovement` referenciará `batchId`, `productId`, `referenceType`, `referenceId`, `referenceItemId`, `actorUserId`, `unitCostBase`, `quantityBase` y `reason`.
- `productId` se duplicará en `InventoryMovement` para consultas analíticas y debe coincidir con la capa.
- Recepción generará `reason` automático `Purchase received`.
- Anulación exigirá `cancelReason` del usuario.
- Una compra `received` solo puede anularse si las capas exactas creadas por sus ítems conservan toda la cantidad original.
- Al anular una recepción intacta, las capas quedan en `availableQuantity = 0` y `status = cancelled`; no se borran.
- Se crearán `AuditLog` para `SUPPLIER_CREATED`, `SUPPLIER_UPDATED`, `PURCHASE_CREATED`, `PURCHASE_UPDATED`, `PURCHASE_RECEIVED` y `PURCHASE_CANCELLED`.
- Se actualizará OpenAPI de forma mínima para endpoints y schemas nuevos.
- En frontend se crearán rutas `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`.
- `SuppliersStore` y `PurchasesStore` serán Zustand separados.
- Cada store manejará lista, paginación, filtros, detalle seleccionado, `draftForm`, `isDirty`, status, error, acciones async y reset.
- Las páginas llamarán cargas al montar y resetearán el store completo al desmontar.
- El reset aplica también al navegar de lista a detalle.
- Los stores no navegarán ni mostrarán toasts; la navegación vive en páginas.
- `PurchasesStore` bloqueará recepción en UI cuando `isDirty = true`.
- Los productos para el formulario de compra se cargarán usando el módulo existente de productos.
- La búsqueda de productos en formulario será local inicialmente.
- Los filtros y paginación no se sincronizarán con query params en esta versión.
- Cambiar filtros reseteará `page` a 1.
- `page` será 1-based, `pageSize` default 20 y máximo 100.

## Testing Decisions

- Las pruebas deben verificar comportamiento externo y reglas de dominio, no detalles internos de implementación.
- El foco principal backend debe estar en services de compras, porque ahí viven transacciones, normalización, capas de inventario, movimientos y auditoría.
- Se deben probar reglas de proveedores: NIT opcional único, paginación, búsqueda, detalle y estado.
- Se deben probar reglas de compras: creación en borrador, reemplazo transaccional de ítems, total calculado, rechazo de productos inactivos, unidad no configurada y duplicados.
- Se deben probar reglas de recepción: compra sin ítems falla, inventariable sin lote/vencimiento falla, expiración vencida falla, ítem no inventariable no genera inventario, recepción válida crea capas y movimientos.
- Se deben probar reglas de anulación: `draft` se cancela con motivo, `received` intacta revierte, `received` consumida se bloquea.
- Se deben probar movimientos con cantidades firmadas y referencia exacta a `purchaseItem`.
- Se deben probar audit logs para creación, actualización, recepción y anulación.
- En frontend, las pruebas más útiles están en stores Zustand y hooks: paginación, filtros, `isDirty`, carga de detalle, reset, creación y actualización de drafts.
- Las páginas deben cubrir estados de carga, error, vacío y permisos cuando se agreguen pruebas de UI.
- No se planifica QA manual en este PRD salvo que el usuario lo pida explícitamente.

## Epic Breakdown

Epic principal: `proveedores-compras-recibidas`

Objetivo del epic: entregar el flujo completo de proveedores y compras recibidas, desde CRUD de proveedores hasta recepción transaccional que crea capas de inventario y movimientos.

Resultado esperado: admin o superadmin puede gestionar proveedores, crear compras en borrador, recibirlas, generar inventario por capas, anular con motivo cuando corresponda y navegar las pantallas con rutas dedicadas.

Secuencia recomendada:

1. `INFRA/BACKEND` - Contratos compartidos, paginación genérica, Prisma schema y migración.
2. `BACKEND` - Módulo de proveedores con endpoints paginados, detalle, creación, edición y auditoría.
3. `BACKEND` - Módulos de compras e inventario interno con borrador, edición, recepción, anulación, movimientos y auditoría.
4. `BACKEND` - OpenAPI mínimo y pruebas de services críticos.
5. `UI` - Módulo frontend de proveedores con API, facade, Zustand, hooks y rutas.
6. `UI` - Módulo frontend de compras con API, facade, Zustand, hooks, rutas, formularios, `isDirty`, recepción y anulación.
7. `UI/INFRA` - Navegación, reset al logout, ajustes de rutas y validación final de integración.

Dependencias:

- Productos, unidades y conversiones deben existir.
- Roles base `superadmin`, `admin` y `seller` ya existen.
- El módulo de productos debe exponer productos con `units`, `baseUnit`, estado e indicadores de inventario.

## Out of Scope

- SIAT, número de documento del proveedor y validación fiscal.
- Pagos a proveedores.
- Cuentas por pagar.
- Flujo de caja real.
- Descuentos complejos de compra.
- Importación desde factura de proveedor.
- Pantalla completa de stock por lote.
- Kardex visual de movimientos.
- Ajustes manuales de inventario.
- Alertas de stock bajo, vencido o próximo a vencer.
- FEFO preview visual.
- Venta POS.
- Bloqueo sanitario avanzado de lotes.
- Sincronización de filtros con query params.
- Creación rápida de proveedor dentro del formulario de compra.

## Further Notes

- El chunk original planteaba creación o actualización de lote consolidado; la decisión final cambia a capas internas de `InventoryBatch` para soportar costos variables.
- La UI futura de inventario debe agrupar capas por producto, número de lote y vencimiento para no exponer complejidad contable al usuario operativo.
- El precio de venta no depende del costo de las capas. Si una venta consume varias capas, el precio cobrado sale del producto o del POS, mientras el margen se calcula con costos reales por capa.
- `documentNumber` fue movido a pendientes de SIAT en `TODO.md`.
- El reset completo al desmontar cada página fue una decisión explícita del usuario, aunque implique perder filtros al navegar de lista a detalle y volver.
