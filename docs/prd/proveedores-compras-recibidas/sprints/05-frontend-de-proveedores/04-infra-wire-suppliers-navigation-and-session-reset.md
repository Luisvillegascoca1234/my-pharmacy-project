# Ticket 04 - Wire Suppliers Navigation And Session Reset

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 05

## Description

Conectar el frontend de proveedores con la navegacion real del shell y con el reset de estado por cierre de sesion. La ruta `suppliers` ya existe en `frontend/src/routes/navigation.ts`; este ticket debe reemplazar el placeholder por las paginas nuevas y registrar el reset del store para que no queden filtros, detalle o formularios entre sesiones.

## Scope

- `frontend/src/routes/app-routes.tsx`
- `frontend/src/routes/navigation.ts` si se requiere ajustar metadata sin cambiar roles
- `frontend/src/modules/auth/utils/resetSessionScopedState.ts`
- exports publicos de `frontend/src/modules/suppliers`
- imports app-level necesarios para que `/suppliers`, `/suppliers/new` y `/suppliers/:id` resuelvan correctamente

## Out Of Scope

- agregar roles o permisos granulares nuevos
- cambiar labels de navegacion no relacionados
- rutas de compras o inventario
- automatizar QA manual
- iniciar o configurar el dev server

## Acceptance Criteria

- `admin` y `superadmin` ven y pueden abrir Proveedores desde el sidebar; `seller` no obtiene la ruta por navegacion visible.
- `/suppliers`, `/suppliers/new` y `/suppliers/:id` renderizan sus paginas reales y dejan de caer en `ModulePage`.
- `getRouteTitle` mantiene titulos coherentes para la ruta base y no rompe el shell cuando se navega a subrutas.
- `resetSessionScopedState` invoca `resetSuppliersStore` o equivalente junto a los stores existentes.
- Los imports de pagina consumen el modulo por su barrel publico cuando salen de `frontend/src/modules/suppliers`.
- La integracion no modifica rutas ni placeholders de compras; ese trabajo queda para el sprint 06.
