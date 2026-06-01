# Ticket 05 - Wire Advanced POS Routes Permissions And Session Resets

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 06

## Description

Ajustar la navegacion, rutas, permisos visibles y resets de sesion para que pendientes, detalle de venta, anulacion y supervision queden accesibles segun rol. La experiencia debe permitir anulacion propia al vendedor sin esconderla detras de una ruta exclusiva de administracion.

## Scope

- Accesos visibles para pendientes y detalle/anulacion de venta desde POS.
- Acceso administrativo separado para supervision de ventas, cajas y pendientes.
- Permisos visibles para seller, admin y superadmin alineados con el PRD.
- Titulos de ruta coherentes para detalle de venta, pendientes y supervision.
- Limpieza de carrito activo, pendiente seleccionado, venta seleccionada, filtros y formularios al cerrar sesion o cambiar usuario.
- Manejo de deep links hacia detalle cuando el rol no tiene acceso o la entidad no existe.
- Registro de cualquier brecha de contrato backend detectada durante la integracion.

## Out Of Scope

- Redisenar toda la navegacion principal.
- Crear nuevos roles.
- Cambiar permisos backend.
- Agregar reportes o exportaciones.
- QA manual o navegador.
- Cerrar el epic como `DONE`.

## Acceptance Criteria

- El vendedor tiene una ruta clara para sus pendientes y anulaciones permitidas.
- Admin y superadmin tienen una ruta clara para supervision global.
- Las rutas bloquean o redirigen estados no autorizados de forma comprensible.
- Los estados transitorios de pendientes, ventas y supervision se limpian al cambiar usuario.
- La navegacion deja de depender de placeholders para las superficies nuevas.
- Las brechas de contrato detectadas quedan documentadas como bloqueo tecnico del sprint, no ocultas como exito parcial.
