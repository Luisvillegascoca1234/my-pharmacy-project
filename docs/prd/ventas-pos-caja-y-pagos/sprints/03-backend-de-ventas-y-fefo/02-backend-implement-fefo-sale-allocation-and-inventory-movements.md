# Ticket 02 - Implement FEFO Sale Allocation And Inventory Movements

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Implementar la asignacion FEFO para ventas confirmadas y los movimientos de salida de inventario asociados. La regla debe consumir primero la capa con vencimiento mas cercano y continuar con capas siguientes cuando una sola no alcance.

## Scope

- Seleccion FEFO de capas vendibles por producto.
- Asignacion de una cantidad entera solicitada sobre una o varias capas.
- Bloqueo de venta cuando el stock total vendible no alcanza.
- Actualizacion de cantidad disponible y estado de capa.
- Creacion de movimiento de inventario tipo salida por venta.
- Calculo de costo total por consumo y por item.
- Referencias auditables a venta, item vendido y capa consumida.

## Out Of Scope

- Anulacion y movimientos inversos de venta.
- Ajustes manuales de inventario.
- Reserva de stock por carrito pendiente.
- Seleccion manual de lote por vendedor.
- Facturacion fiscal.

## Acceptance Criteria

- FEFO ordena por vencimiento mas cercano y desempata por capa mas antigua.
- Un item puede consumir una o varias capas.
- Si el stock total vendible no alcanza para cualquier item, la operacion completa falla sin cambios parciales.
- Cada consumo crea un registro de consumo por lote/capa.
- Cada consumo genera movimiento de inventario `sale_completed` con cantidad negativa.
- Las capas consumidas actualizan `availableQuantity` y pasan a `depleted` cuando llegan a cero.
- El costo del item se calcula desde los costos reales de las capas consumidas.
