# Ticket 05 - Wire purchases navigation session reset and route titles

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 06

## Description

Integrar las rutas reales de compras con el router, titulos de pagina, navegacion existente y reset de estado al cerrar sesion. La navegacion ya contiene el item `purchases`; este ticket reemplaza el placeholder por pantallas reales y agrega el reset del nuevo store sin cambiar permisos ni grupos de sidebar.

## Scope

- `frontend/src/routes/app-routes.tsx`
- `frontend/src/routes/navigation.ts` solo si hace falta ajustar metadata existente
- `frontend/src/modules/auth/utils/resetSessionScopedState.ts`
- barrels publicos necesarios de `frontend/src/modules/purchases`
- imports de paginas nuevas de compras
- titulos para `/purchases`, `/purchases/new` y `/purchases/:id`

## Out Of Scope

- rediseño del sidebar o reagrupacion de navegacion
- cambios de permisos por rol
- rutas de inventario, SIAT, pagos, reportes o POS
- QA manual, cubierto por el ticket posterior
- refactors generales de routing

## Acceptance Criteria

- `/purchases`, `/purchases/new` y `/purchases/:id` renderizan paginas reales para roles autorizados.
- `seller` no obtiene acceso nuevo a compras.
- `getRouteTitle` devuelve titulos en espanol para lista, creacion y detalle de compras.
- El reset de sesion llama `resetPurchasesStore()` junto con los otros stores de sesion.
- Las rutas de proveedores existentes siguen apuntando a sus paginas actuales.
- No quedan placeholders de `ModulePage` para la ruta `purchases` cuando el usuario tiene permiso.
