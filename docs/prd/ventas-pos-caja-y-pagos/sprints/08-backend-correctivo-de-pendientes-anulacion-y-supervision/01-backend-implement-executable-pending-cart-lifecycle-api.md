# Ticket 01 - Implement Executable Pending Cart Lifecycle API

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Implementar la API ejecutable de carritos pendientes para que el POS pueda guardar, listar, editar, descartar y convertir pendientes bajo las reglas aprobadas: no reservan stock, no congelan precio, expiran a 3 dias y se revalidan antes del cobro.

## Scope

- Persistencia y lectura de carritos pendientes con items, vendedor propietario, nombre o nota, estado y fecha de expiracion.
- Listado paginado de pendientes propios para vendedor.
- Listado paginado de pendientes de todos para admin/superadmin.
- Guardado y edicion de pendientes con cantidades enteras positivas.
- Descarte de pendientes propios y descarte administrativo.
- Expiracion a 3 dias y bloqueo de cobro para pendientes expirados.
- Conversion de pendiente a venta efectiva usando precio y stock vigentes.
- Revalidacion de producto no vendible, cambio de precio y stock insuficiente antes del cobro.

## Out Of Scope

- Reserva de stock.
- Congelamiento de precio.
- Reasignacion de pendientes entre vendedores.
- Cobro de pendientes ajenos por vendedor.
- Pagos distintos a efectivo.
- UI nueva o cambios visuales.
- Sincronizacion offline.

## Acceptance Criteria

- Un vendedor puede crear, listar, editar y descartar solo sus pendientes activos.
- Admin y superadmin pueden listar y descartar pendientes de todos.
- Un pendiente expira exactamente segun la regla de 3 dias y no puede convertirse a venta.
- Convertir un pendiente exige caja abierta del vendedor que cobra.
- La conversion revalida precio, producto vendible y stock disponible antes de crear venta.
- Si la conversion falla por stock, precio o producto, el pendiente se conserva para correccion.
- Una conversion exitosa crea venta efectiva y marca el pendiente como convertido.
- Ninguna operacion de pendiente descuenta inventario antes del cobro.
