# Ticket 01 - Build Suppliers Data Module And Store

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear el modulo frontend portable de proveedores para consumir `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers` y `PATCH /api/suppliers/:id`. El modulo debe seguir el patron existente de `frontend/src/modules/products` y `frontend/src/modules/users`, pero separando estado, acciones, selectores e implementacion del store para soportar lista paginada, filtros, detalle seleccionado, formulario editable, estado de carga, errores, `isDirty` y reset completo.

## Scope

- `frontend/src/modules/suppliers/api`
- `frontend/src/modules/suppliers/facades`
- `frontend/src/modules/suppliers/hooks`
- `frontend/src/modules/suppliers/store`
- `frontend/src/modules/suppliers/types`, `schemas` o `utils` si hacen falta para normalizacion
- `frontend/src/modules/suppliers/index.ts`
- contratos importados desde `@pharmacy-pos/shared`

## Out Of Scope

- JSX, componentes, paginas, iconos, estilos o copy visible dentro de `frontend/src/modules/suppliers`
- navegacion con React Router dentro del store o facade
- toasts, modales globales o decisiones visuales en el modulo
- rutas de compras, inventario, productos o unidades
- cambios backend, Prisma u OpenAPI

## Acceptance Criteria

- El cliente de API de proveedores es solo transporte: construye endpoint, pasa `params` o payload y devuelve `response.data`.
- El facade expone operaciones de aplicacion para listar, obtener detalle, crear y actualizar proveedores sin filtrar detalles HTTP hacia paginas.
- El store define `State`, `Actions`, `Selectors` y `Store` en archivos separados, con `initialState` exportado y selectores estables.
- El estado soporta `items`, paginacion 1-based, `search`, `status`, detalle seleccionado, `draftForm`, `isDirty`, `status` de carga, `error` y `reset`.
- Cambiar `search` o `status` resetea `page` a 1 antes de recargar.
- Crear o actualizar proveedor usa los schemas/tipos compartidos y refresca el detalle o lista afectada sin navegar desde el store.
- El barrel publico exporta solo hooks, reset/selectores publicos, tipos y contratos utiles; no exporta internals innecesarios.
- `frontend/src/modules/suppliers` no contiene `.tsx`, `components/`, imports de UI, imports de router, iconos, CSS ni copy visible de pantalla.
