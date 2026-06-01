# Ticket 02 - Implement Pending Cart Lifecycle Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05
- Blocks: 03, 04

## Description

Implementar el ciclo de vida de carritos pendientes sin reserva de stock ni congelamiento de precio. El vendedor debe poder guardar, listar, editar, descartar y convertir sus pendientes; admin/superadmin pueden supervisar y descartar pendientes de todos.

## Scope

- Guardado de carrito pendiente con nombre o nota.
- Edicion de items, nombre y nota.
- Listado de pendientes propios para vendedor.
- Listado/supervision de pendientes de todos para admin/superadmin.
- Descarte propio y descarte administrativo.
- Expiracion a 3 dias.
- Revalidacion de producto, stock y precio al consultar o convertir.
- Conversion a venta reutilizando la creacion transaccional de venta confirmada.
- Marcado de pendiente como convertido cuando el cobro funciona.

## Out Of Scope

- Reserva de stock.
- Congelamiento de precio.
- Reasignacion de carritos.
- Cobro de pendientes ajenos por vendedor.
- UI de lista de pendientes.
- Sincronizacion en tiempo real.

## Acceptance Criteria

- Guardar pendiente no cambia inventario ni caja.
- El pendiente expira a los 3 dias desde su creacion o actualizacion segun la regla definida en implementacion.
- Vendedor ve y edita solo sus pendientes activos.
- Admin/superadmin pueden ver y descartar pendientes de todos.
- Al retomar, el sistema expone precio referencial y precio actual cuando difieren.
- Un pendiente expirado no puede convertirse en venta.
- Un pendiente con producto inactivo o stock insuficiente no puede convertirse hasta corregirse.
- Convertir pendiente exige caja abierta del usuario que cobra.
- Si la conversion falla, el pendiente permanece activo.
- Si la conversion funciona, el pendiente queda convertido y relacionado con la venta.

## Historical Reconciliation

- Estado reconciliado durante Sprint 09: el ciclo de carritos pendientes quedo cubierto por el correctivo backend del Sprint 08, con guardado, edicion, listado, descarte, expiracion a 3 dias, revalidacion y conversion sin reserva de stock ni precio congelado.
