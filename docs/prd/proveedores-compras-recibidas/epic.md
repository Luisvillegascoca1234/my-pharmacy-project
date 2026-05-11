# Epic - Proveedores y Compras Recibidas

- PRD: ./PRD.md
- Status: TODO
- Slug: proveedores-compras-recibidas

## Goal

Implementar el flujo operativo de proveedores y compras recibidas para que una compra en borrador pueda convertirse en capas de inventario y movimientos de entrada dentro de una transacción auditada.

## Expected Result

Al finalizar el epic, un usuario `admin` o `superadmin` podrá:

- Crear, listar, paginar, buscar, editar, activar y desactivar proveedores.
- Crear compras en borrador con ítems comerciales.
- Guardar borradores y abrirlos por URL.
- Editar compras solo mientras estén en `draft`.
- Recibir compras sin cambios pendientes.
- Generar capas `InventoryBatch` por ítem inventariable recibido.
- Generar `InventoryMovement` de entrada por cada capa.
- Anular compras en borrador con motivo.
- Anular compras recibidas solo si las capas creadas siguen intactas.
- Consultar compras y proveedores desde rutas dedicadas.

## Product Scope

- Gestión de proveedores con rutas `/suppliers`, `/suppliers/new` y `/suppliers/:id`.
- Gestión de compras con rutas `/purchases`, `/purchases/new` y `/purchases/:id`.
- Listas paginadas para proveedores y compras.
- Filtros de compras por estado, proveedor, fechas y búsqueda.
- Búsqueda y filtro de proveedores por texto y estado.
- Formulario de compra con proveedor, fecha, notas e ítems.
- Validación de unidades configuradas por producto.
- Recepción con `receiveNotes` opcional.
- Anulación con `cancelReason` obligatorio.
- Estado `isDirty` para obligar a guardar antes de recibir.

## Technical Scope

- Contratos compartidos Zod para proveedores, compras, ítems, recepción, anulación y paginación.
- Modelos Prisma para `Supplier`, `Purchase`, `PurchaseItem`, `InventoryBatch` e `InventoryMovement`.
- Enums para estados de proveedor, compra, capa de inventario y tipo de movimiento.
- Migración PostgreSQL para nuevas tablas, relaciones, índices y unicidad parcial de NIT cuando aplique.
- Módulo backend `suppliers` con routes, controllers, services, repositories y types.
- Módulo backend `purchases` con routes, controllers, services, repositories y types.
- Módulo backend `inventory` interno para crear/revertir capas y movimientos desde compras.
- Transacciones explícitas en recepción y anulación de compras recibidas.
- Audit logs para proveedores y compras.
- OpenAPI mínimo para endpoints nuevos.
- Módulos frontend `suppliers` y `purchases` con api, facades, hooks, store y barrel público.
- Stores Zustand separados con `State`, `Actions`, `Selectors` y `Store`.
- Reset de stores al desmontar páginas y al logout.
- Rutas frontend nuevas y navegación/sidebar actualizada.

## Sprint Plan

1. Contratos y persistencia: schemas compartidos, paginación genérica, Prisma schema, migración y generación de cliente.
2. Backend de proveedores: endpoints paginados, detalle, creación, edición, estado y auditoría.
3. Backend de compras e inventario: borrador, edición transaccional, recepción, capas, movimientos, anulación y auditoría.
4. Pruebas backend y OpenAPI: cobertura de services críticos, errores de dominio y documentación mínima.
5. Frontend de proveedores: API, facade, Zustand, hooks, rutas de lista, creación y detalle.
6. Frontend de compras: API, facade, Zustand, hooks, rutas de lista, creación, detalle, ítems, `isDirty`, recepción y anulación.
7. Integración final: navegación, reset de stores, permisos visibles, estados vacíos/carga/error y cierre técnico.

## Ticket Category Hints

- `INFRA`: paginación compartida, migración Prisma, seed si hiciera falta, generación Prisma, OpenAPI base.
- `BACKEND`: suppliers module, purchases module, inventory layer helpers, audit integration, service tests.
- `UI`: suppliers routes, purchases routes, Zustand stores, forms, paginated lists, product/unit selection, receive/cancel UX.

## Dependencies

- Catálogo de productos, categorías, unidades y conversiones ya implementado.
- Productos deben exponer `units`, `baseUnit`, `status`, `isInventoryTracked`, `requiresBatch` y `requiresExpiration`.
- Roles base ya disponibles: `superadmin`, `admin`, `seller`.
- Cliente Axios y patrón de módulos frontend existente.
- Prisma y PostgreSQL configurados.

## Out of Scope

- SIAT y `documentNumber`.
- Pagos a proveedores y cuentas por pagar.
- Caja y flujo financiero real.
- Pantalla de stock, kardex, alertas y ajustes manuales.
- Venta POS y descuento FEFO.
- Query params sincronizados con filtros.
- Creación rápida de proveedor desde compras.

## Notes for create-epic-sprint

- Priorizar backend transaccional antes de UI de recepción.
- Mantener `InventoryBatch` como capa interna, no como lote físico único.
- No crear sprint tickets para SIAT ni inventario visual.
- Considerar pruebas de service como parte obligatoria del primer corte backend de compras.
- Los stores Zustand deben ser data-only: sin router, toasts, JSX, copy visible ni imports de UI.
- Las páginas pueden navegar después de crear proveedor o compra, pero los stores no.
- El reset al desmontar debe limpiar el store completo, incluso entre lista y detalle.
