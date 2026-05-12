# Ticket 01 - Build purchases data module and store

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear el modulo frontend portable de compras para consumir `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `PATCH /api/purchases/:id`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`. El modulo debe seguir el patron de `frontend/src/modules/suppliers`, pero modelando el formulario de compra con encabezado, items, `isDirty`, filtros, paginacion, detalle seleccionado y estados separados para lista, detalle, guardado, recepcion y anulacion.

## Scope

- `frontend/src/modules/purchases/api`
- `frontend/src/modules/purchases/facades`
- `frontend/src/modules/purchases/hooks`
- `frontend/src/modules/purchases/store`
- `frontend/src/modules/purchases/types`, `schemas` o `utils` para normalizacion y payloads
- `frontend/src/modules/purchases/index.ts`
- contratos importados desde `@pharmacy-pos/shared`

## Out Of Scope

- JSX, componentes, paginas, iconos, estilos o copy visible dentro de `frontend/src/modules/purchases`
- navegacion con React Router dentro del store o facade
- toasts, modales globales o decisiones visuales en el modulo
- catalogo propio de productos o proveedores duplicado dentro del modulo de compras
- cambios backend, Prisma, OpenAPI, SIAT, pagos, kardex o inventario visual

## Acceptance Criteria

- El cliente de API de compras es solo transporte: construye endpoints, pasa `params` o payload y devuelve `response.data`.
- El facade expone operaciones para listar, obtener detalle, crear, actualizar, recibir y anular compras, validando payloads con contratos compartidos.
- El store define `State`, `Actions`, `Selectors` y `Store` en archivos separados, con `initialState` exportado y selectores estables.
- El estado soporta `items`, paginacion 1-based, `search`, `status`, `supplierId`, rango `fromDate`/`toDate`, detalle seleccionado, `draftForm`, `isDirty`, estados de carga, errores y `reset`.
- Cambiar filtros resetea `page` a 1 antes de recargar.
- `draftForm` cubre `supplierId`, `purchaseDate`, `notes` e items con `productId`, `unitId`, `quantity`, `unitCost`, `batchNumber` y `expirationDate`.
- Crear o actualizar compra usa `CreatePurchaseSchema` o `UpdatePurchaseSchema`; recibir usa `ReceivePurchaseSchema`; anular usa `CancelPurchaseSchema`.
- Las acciones de recepcion y anulacion refrescan el detalle y lista afectada sin navegar desde el store.
- El barrel publico exporta solo hooks, reset/selectores publicos, tipos y contratos utiles; no exporta internals innecesarios.
- `frontend/src/modules/purchases` no contiene `.tsx`, `components/`, imports de UI, imports de router, iconos, CSS ni copy visible de pantalla.
