# Sprint 06 - Frontend De Compras

## Goal

Implementar el frontend de compras con modulo portable de datos, rutas dedicadas, formulario de borrador, detalle operativo, estado isDirty, recepcion y anulacion.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El cliente cuenta con un modulo frontend de compras con API, facade, Zustand, hooks y tipos consumidos desde un barrel publico.
- Admin y superadmin pueden listar, filtrar, crear, editar, recibir y anular compras desde rutas dedicadas sin exponer el flujo a seller.
- El formulario de compra usa proveedores activos y productos/unidades existentes, bloquea recepcion con cambios pendientes y mantiene compras received/cancelled en solo lectura.

## Execution Order

### UI

1. [01-ui-build-purchases-data-module-and-store.md](./01-ui-build-purchases-data-module-and-store.md)
2. [02-ui-build-purchases-list-route.md](./02-ui-build-purchases-list-route.md)
3. [03-ui-build-purchase-draft-form-route.md](./03-ui-build-purchase-draft-form-route.md)
4. [04-ui-build-purchase-detail-receive-and-cancel-route.md](./04-ui-build-purchase-detail-receive-and-cancel-route.md)

### INFRA

5. [05-infra-wire-purchases-navigation-session-reset-and-route-titles.md](./05-infra-wire-purchases-navigation-session-reset-and-route-titles.md)
6. [06-infra-clean-up-touched-code-and-references.md](./06-infra-clean-up-touched-code-and-references.md)
7. [07-infra-run-manual-qa-on-affected-areas.md](./07-infra-run-manual-qa-on-affected-areas.md)
8. [08-infra-update-thesis-with-sprint-evidence.md](./08-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint implementa solamente el frontend de compras sobre endpoints y contratos backend ya cerrados. Debe crear el modulo portable `frontend/src/modules/purchases`, las rutas `/purchases`, `/purchases/new` y `/purchases/:id`, y la integracion minima con navegacion, titulos y reset de sesion. El modulo debe seguir el patron de `frontend/src/modules/suppliers` y consumir los productos/unidades existentes a traves del modulo publico de productos, sin duplicar catalogos ni meter UI dentro de `src/modules`.

No debe modificar reglas backend, Prisma, OpenAPI, inventario visual, SIAT, pagos, cuentas por pagar, POS, kardex, stock por lote ni query params sincronizados. Los stores deben mantenerse sin router, toasts, JSX, copy visible, iconos o imports de UI. Las compras `received` y `cancelled` se muestran como solo lectura; la recepcion se bloquea cuando `isDirty = true`.
