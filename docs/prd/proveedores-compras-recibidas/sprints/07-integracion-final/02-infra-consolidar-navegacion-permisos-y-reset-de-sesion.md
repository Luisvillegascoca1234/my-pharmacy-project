# Ticket 02 - Consolidar navegacion permisos y reset de sesion

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 03

## Description

Consolidar el cableado transversal que permite usar proveedores y compras como parte normal de la aplicacion: navegacion lateral, titulos de ruta, guardado de acceso por rol y limpieza de estado al desmontar paginas o cerrar sesion. El objetivo es eliminar inconsistencias entre rutas visibles, rutas accesibles por URL directa y stores que puedan conservar datos de otro flujo.

La base existente ya incluye `getVisibleNavigationItems`, `getVisibleNavigationGroups`, rutas condicionales para proveedores/compras y `resetSessionScopedState`. Este ticket debe verificar y ajustar ese cableado contra el PRD, no cambiar el modelo de permisos ni introducir permisos granulares nuevos.

## Scope

- `frontend/src/routes/app-routes.tsx`
- `frontend/src/routes/navigation.ts`
- `frontend/src/layouts/app-sidebar.tsx`
- `frontend/src/modules/auth/utils/resetSessionScopedState.ts`
- `frontend/src/pages/logout/LogoutPage.tsx`
- exports publicos de `frontend/src/modules/suppliers` y `frontend/src/modules/purchases` necesarios para reset
- rutas y labels de proveedores/compras en el shell de la app

## Out Of Scope

- permisos granulares nuevos
- cambios en roles base distintos de `superadmin`, `admin` y `seller`
- persistencia de filtros en URL o storage
- redisenar el sidebar o el shell global
- modificar reglas backend de autorizacion salvo inconsistencia directa contra rutas ya existentes

## Acceptance Criteria

- `superadmin` y `admin` ven y pueden acceder a Proveedores y Compras desde sidebar y deep links.
- `seller` no ve Proveedores ni Compras en sidebar y no queda con acceso accidental a `/suppliers*` o `/purchases*`.
- `getRouteTitle` cubre listas, creacion y detalle de proveedores/compras con titulos visibles correctos.
- La navegacion activa del sidebar reconoce rutas hijas como `/suppliers/:id` y `/purchases/:id`.
- Cerrar sesion llama resets de proveedores, compras y modulos de catalogo relacionados antes de limpiar autenticacion.
- Navegar entre lista, creacion y detalle no deja filtros, detalle seleccionado o `draftForm` cruzados fuera de las decisiones documentadas.
