# Sprint 05 - Frontend De Proveedores

## Goal

Implementar el frontend de proveedores con modulo portable de datos, rutas dedicadas y pantallas operativas para lista, creacion y detalle/edicion.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El cliente cuenta con un modulo frontend de proveedores con API, facade, Zustand, hooks y tipos consumidos desde un barrel publico.
- Admin y superadmin pueden listar, buscar, filtrar, crear, editar, activar y desactivar proveedores desde rutas dedicadas sin exponer el flujo a seller.
- La navegacion y el reset de estado quedan integrados con el shell actual sin mezclar compras ni inventario visual.

## Execution Order

### UI

1. [01-ui-build-suppliers-data-module-and-store.md](./01-ui-build-suppliers-data-module-and-store.md)
2. [02-ui-build-suppliers-list-route.md](./02-ui-build-suppliers-list-route.md)
3. [03-ui-build-supplier-create-and-detail-routes.md](./03-ui-build-supplier-create-and-detail-routes.md)

### INFRA

4. [04-infra-wire-suppliers-navigation-and-session-reset.md](./04-infra-wire-suppliers-navigation-and-session-reset.md)
5. [05-infra-clean-up-touched-code-and-references.md](./05-infra-clean-up-touched-code-and-references.md)
6. [06-infra-run-manual-qa-on-affected-areas.md](./06-infra-run-manual-qa-on-affected-areas.md)
7. [07-infra-update-thesis-with-sprint-evidence.md](./07-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint implementa solamente el frontend de proveedores sobre endpoints y contratos backend ya cerrados. Debe crear el modulo portable `frontend/src/modules/suppliers`, las rutas `/suppliers`, `/suppliers/new` y `/suppliers/:id`, y la integracion minima con navegacion y reset de sesion. No debe mezclar compras, formulario de compras, seleccion de productos, inventario visual, SIAT, pagos, cuentas por pagar, POS, FEFO de ventas ni cambios funcionales de backend. Los stores deben mantenerse sin router, toasts, JSX, copy visible, iconos o imports de UI.
