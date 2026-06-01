# Ticket 01 - Build Cash And POS Data Modules

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Preparar los modulos de datos que consumira la experiencia de caja y POS. Deben cubrir caja actual, apertura, cierre propio, busqueda POS, carrito activo local, cobro efectivo y comprobante de venta, manteniendo separada la logica portable de los detalles visuales de pantalla.

## Scope

- Cliente de caja: caja actual, apertura y cierre propio.
- Cliente POS: busqueda de productos vendibles y creacion de venta con pago efectivo.
- Estado portable para carrito activo, resultados de busqueda, cobro, comprobante y errores de datos.
- Normalizacion de montos, cantidades enteras, totales y cambio.
- Contratos compartidos ya definidos por los sprints backend.
- Reset de datos sensibles al cerrar sesion o cambiar de usuario.

## Out Of Scope

- Componentes visuales, layouts o copy de pantalla.
- Carritos pendientes visibles.
- Anulacion de ventas desde UI.
- Cierre de caja ajena o supervision administrativa.
- Persistencia local del carrito mas alla de la sesion activa.
- Nuevos endpoints o cambios de reglas backend.

## Acceptance Criteria

- Existe una interfaz publica para consultar caja actual y ejecutar apertura/cierre propio.
- Existe una interfaz publica para buscar productos vendibles y confirmar venta con pago efectivo.
- El carrito activo permite agregar, actualizar cantidad, quitar items y vaciarse sin reservar stock.
- Los totales del carrito y el cambio se calculan de forma consistente con montos no negativos.
- Los errores de caja cerrada, stock insuficiente, monto recibido insuficiente y sesion invalida quedan representados como estados consumibles por UI.
- Los modulos no contienen componentes, estilos, rutas, iconos ni textos visibles de producto.
