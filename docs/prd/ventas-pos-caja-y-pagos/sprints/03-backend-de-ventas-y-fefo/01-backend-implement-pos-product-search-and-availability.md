# Ticket 01 - Implement POS Product Search And Availability

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 06
- Blocks: 02

## Description

Implementar la busqueda backend de productos vendibles para POS. El objetivo es que el vendedor pueda encontrar productos activos por nombre o codigo y que el resultado muestre solo stock vendible, excluyendo capas vencidas, canceladas, agotadas o no aptas.

## Scope

- Busqueda por nombre comercial, nombre generico, codigo interno y codigo de barras.
- Coincidencia por codigo para uso con lector como teclado.
- Calculo de stock total vendible por producto.
- Proximo vencimiento disponible como dato secundario.
- Paginacion o limite de resultados coherente con contratos compartidos.
- Mapeo a `PosProductSchema`.

## Out Of Scope

- Carrito frontend o experiencia visual POS.
- Reserva de stock.
- Creacion de venta, pago o movimientos.
- Anulacion de ventas.
- Productos sin stock como flujo principal.

## Acceptance Criteria

- Solo aparecen productos `active` con stock vendible mayor a cero en el flujo principal.
- El stock vendible suma solo capas `active`, con cantidad disponible positiva y no vencidas.
- Capas `depleted`, `cancelled`, vencidas o sin cantidad disponible no cuentan.
- La busqueda encuentra por nombre comercial, nombre generico, codigo interno y codigo de barras.
- El resultado incluye precio vigente del producto y unidad base.
- El resultado incluye proximo vencimiento cuando existe stock con vencimiento.
- El orden favorece resultados estables para uso de mostrador.
