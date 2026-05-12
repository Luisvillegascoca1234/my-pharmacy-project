# Ticket 02 - Build purchases list route

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Construir la ruta `/purchases` para listar compras paginadas con filtros operativos y acceso a creacion o detalle. La pantalla debe consumir el barrel publico de `frontend/src/modules/purchases`, respetar permisos para `admin` y `superadmin`, y resetear el estado de compras al desmontar igual que la pantalla de proveedores.

## Scope

- `frontend/src/pages/purchases-page.tsx` o estructura equivalente ya usada por paginas
- consumo de `usePurchases` desde `frontend/src/modules/purchases`
- filtros por estado, proveedor, rango de fechas y busqueda
- tabla/lista paginada con proveedor, fecha, estado, total, recepcion y acciones de navegacion
- estados de carga, error, vacio y permiso insuficiente
- enlace o boton hacia `/purchases/new` y apertura de `/purchases/:id`

## Out Of Scope

- formulario completo de creacion o edicion de compras
- recepcion, anulacion y modales de detalle
- sincronizacion de filtros con query params
- cambios en rutas globales o sidebar, salvo los ya cubiertos por el ticket de wiring
- inventario visual, kardex, SIAT, pagos o reportes

## Acceptance Criteria

- `/purchases` carga la lista paginada desde `GET /api/purchases` mediante el hook publico del modulo.
- Los filtros de estado, proveedor, rango de fechas y busqueda actualizan el store, resetean `page` a 1 y recargan datos.
- La lista muestra total, estado, proveedor, fecha comercial, fecha de recepcion cuando exista y acciones claras para abrir detalle.
- Los estados vacio, loading y error no rompen layout ni dependen de datos mock.
- Solo `admin` y `superadmin` ven la gestion de compras; `seller` queda fuera del flujo por las reglas de navegacion existentes.
- La pagina no importa clientes API profundos ni internals del store.
- La pagina ejecuta `reset` del modulo al desmontar para evitar estado cruzado entre lista y detalle.
