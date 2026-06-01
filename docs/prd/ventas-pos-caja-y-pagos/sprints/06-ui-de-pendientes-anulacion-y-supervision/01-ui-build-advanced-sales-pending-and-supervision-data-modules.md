# Ticket 01 - Build Advanced Sales Pending And Supervision Data Modules

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Preparar los modulos de datos necesarios para pendientes, detalle de venta, anulacion y supervision. Deben extender la base de caja/POS ya implementada sin mezclar reglas visuales con comportamiento portable, y deben exponer estados claros para permisos, expiracion, revalidacion y errores operativos.

## Scope

- Cliente de carritos pendientes: listar, crear, actualizar, descartar, retomar y convertir a venta.
- Cliente de ventas: listar ventas segun rol, consultar detalle y anular con motivo.
- Cliente de caja administrativa: listar cajas supervisables y cerrar caja ajena con monto contado final.
- Estado portable para filtros, seleccion, detalle, motivo de anulacion, revalidacion de pendiente y operaciones en curso.
- Mapeo de errores para pendiente expirado, stock insuficiente, precio cambiado, venta no anulable, caja cerrada, acceso denegado y sesion invalida.
- Reset de datos sensibles al cerrar sesion o cambiar de usuario.

## Out Of Scope

- Pantallas finales o copy visual.
- Nuevas reglas de negocio backend.
- Reserva de stock o congelamiento de precio en pendientes.
- Reasignacion de pendientes entre vendedores.
- Reapertura de cajas cerradas.
- Reportes analiticos o exportaciones.
- Facturacion SIAT, QR, tarjeta, credito o pagos mixtos.

## Acceptance Criteria

- La interfaz publica permite gestionar carritos pendientes propios y, para administracion, pendientes de todos cuando el rol lo permite.
- La interfaz publica permite consultar detalle de venta y solicitar anulacion con motivo obligatorio.
- La interfaz publica permite listar cajas supervisables y cerrar caja ajena para admin/superadmin.
- Los estados distinguen carga, vacio, error, acceso denegado, pendiente expirado y operacion exitosa.
- La revalidacion de pendiente puede representar cambio de precio, falta de stock o producto no vendible antes del cobro.
- Los modulos no contienen componentes, estilos, rutas, iconos ni textos visibles de producto.
