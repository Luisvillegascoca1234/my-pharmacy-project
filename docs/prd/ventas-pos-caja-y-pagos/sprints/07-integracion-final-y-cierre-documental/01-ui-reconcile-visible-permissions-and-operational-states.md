# Ticket 01 - Reconcile Visible Permissions And Operational States

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 03

## Description

Reconciliar la experiencia visible de ventas POS, caja, pendientes, anulacion y supervision para que los estados y permisos finales coincidan con el PRD. El objetivo no es crear un flujo nuevo, sino cerrar diferencias de integracion entre roles, mensajes, estados vacios, errores y acciones disponibles.

## Scope

- Visibilidad por rol para vendedor, admin y superadmin.
- Estados de caja abierta, caja cerrada, caja ajena, venta confirmada, venta anulada y pendiente expirado.
- Acciones disponibles para venta, guardado de pendiente, cobro efectivo, anulacion permitida, descarte de pendiente y cierre administrativo.
- Mensajes de error o bloqueo para caja cerrada, stock insuficiente, pago insuficiente, pendiente expirado, venta no anulable y acceso denegado.
- Titulos y navegacion coherentes entre mostrador, caja, pendientes, anulacion y supervision.
- Reset de estado transitorio cuando cambia la sesion del usuario.

## Out Of Scope

- Redisenos visuales amplios.
- Nuevas pantallas comerciales fuera del flujo de ventas POS.
- Cambios de reglas backend.
- Nuevos roles o permisos.
- QA manual o recorridos en navegador.
- Reportes, SIAT, QR, tarjeta, credito o descuentos.

## Acceptance Criteria

- Vendedor ve solamente acciones propias de mostrador, caja propia, ventas propias y pendientes propios.
- Admin y superadmin ven acciones de supervision, cierre de caja ajena, pendientes de todos y anulaciones permitidas.
- Las acciones no permitidas quedan ocultas o bloqueadas con mensaje claro, no como errores tecnicos sin contexto.
- Los estados de carga, vacio, error, vencimiento, caja cerrada y venta anulada estan cubiertos en las superficies finales.
- Cambiar de usuario no conserva carrito, pendiente, venta seleccionada, filtros o formularios sensibles del usuario anterior.
- Cualquier brecha real contra el PRD queda documentada como deuda de cierre antes del ticket final.
