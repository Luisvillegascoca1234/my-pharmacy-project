# Ticket 02 - Add Pending Cart Flow To POS

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Agregar al POS el flujo de carritos pendientes para pausar una atencion, retomarla y cobrarla bajo las reglas aprobadas: el pendiente no reserva stock, no congela precio, expira a 3 dias y se revalida antes del cobro.

## Scope

- Guardar carrito activo como pendiente con nombre corto o nota.
- Listar pendientes propios dentro del flujo de mostrador.
- Retomar pendiente hacia el carrito activo sin exigir caja abierta.
- Editar cantidades, agregar o quitar productos antes de cobrar.
- Descartar pendiente propio.
- Mostrar expiracion a 3 dias, estado expirado y bloqueo de cobro para pendientes expirados.
- Advertir cambio de precio, producto no vendible o stock insuficiente al retomar o cobrar.
- Remover el pendiente de la lista cuando se cobra correctamente.

## Out Of Scope

- Cobrar pendientes ajenos por vendedor.
- Reasignar pendientes.
- Reservar stock o congelar precio.
- Pagos distintos a efectivo.
- Guardar pendientes sin items.
- Sincronizacion offline.
- Supervision administrativa de todos los pendientes, cubierta por otro ticket.

## Acceptance Criteria

- Un vendedor puede guardar el carrito activo como pendiente con nombre o nota.
- Un pendiente guardado no descuenta ni bloquea inventario en la UI.
- Un vendedor puede retomar un pendiente propio aun sin caja abierta, pero no puede cobrarlo sin caja abierta.
- Al retomar, la UI informa cambios de precio, falta de stock o producto no vendible antes de confirmar.
- Un pendiente expirado se muestra como no cobrable.
- Al cobrar correctamente un pendiente, desaparece de pendientes y queda venta confirmada.
- Si el cobro falla, el pendiente se conserva para correccion.
