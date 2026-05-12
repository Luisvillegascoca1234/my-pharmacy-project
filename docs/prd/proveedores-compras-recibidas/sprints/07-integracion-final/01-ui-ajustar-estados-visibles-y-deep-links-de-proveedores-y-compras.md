# Ticket 01 - Ajustar estados visibles y deep links de proveedores y compras

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 04

## Description

Revisar y ajustar la experiencia visible de proveedores y compras para que las rutas finales del PRD se comporten de forma coherente desde lista, creacion, detalle y enlaces directos. El trabajo debe enfocarse en estados de carga, error, vacio, permiso insuficiente, solo lectura, `isDirty`, acciones bloqueadas y navegacion entre lista y detalle sin estado cruzado.

La exploracion previa muestra que `frontend/src/routes/app-routes.tsx`, `frontend/src/routes/navigation.ts`, `frontend/src/layouts/app-sidebar.tsx`, `frontend/src/pages/suppliers-page.tsx` y `frontend/src/pages/purchases-page.tsx` ya tienen cableado base. Este ticket no debe reimplementar esos flujos; debe cerrar inconsistencias visibles, mensajes, rutas y estados de borde que impidan validar el epic completo.

## Scope

- `frontend/src/pages/suppliers-page.tsx`
- `frontend/src/pages/supplier-form-page.tsx`
- `frontend/src/pages/purchases-page.tsx`
- `frontend/src/pages/purchase-form-page.tsx`
- consumo publico de `frontend/src/modules/suppliers`
- consumo publico de `frontend/src/modules/purchases`
- estados visibles de `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new` y `/purchases/:id`

## Out Of Scope

- cambios en `frontend/src/modules/*` salvo que un estado visible revele un contrato publico incompleto
- cambios backend, Prisma, migraciones o reglas transaccionales
- sincronizacion de filtros con query params
- inventario visual, kardex, SIAT, pagos, cuentas por pagar o POS
- redisenos amplios fuera de la superficie de proveedores y compras

## Acceptance Criteria

- Las rutas de lista, creacion y detalle de proveedores muestran estados de carga, error, vacio y permiso insuficiente sin romper layout.
- Las rutas de lista, creacion y detalle de compras muestran estados de carga, error, vacio, solo lectura para `received`/`cancelled` y bloqueo de recepcion cuando `isDirty = true`.
- Los enlaces desde listas hacia detalles y desde formularios hacia listas usan rutas estables sin depender de estado previo del store.
- Un deep link a `/suppliers/:id` o `/purchases/:id` hidrata el detalle con la carga necesaria o muestra un error recuperable si el recurso no existe.
- La UI no importa internals profundos de `modules/suppliers` ni `modules/purchases`; consume barrels publicos, hooks o facades existentes.
- Los textos visibles permanecen en espanol y el codigo nuevo mantiene identificadores en ingles.
