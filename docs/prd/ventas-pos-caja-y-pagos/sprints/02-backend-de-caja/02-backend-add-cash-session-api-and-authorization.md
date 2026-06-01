# Ticket 02 - Add Cash Session API And Authorization

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Exponer la API de caja para abrir sesion, consultar caja actual, cerrar caja propia y permitir cierre ajeno por admin/superadmin. Este ticket conecta las reglas del ticket anterior con validacion de contratos compartidos, autenticacion, autorizacion por rol y respuestas HTTP consistentes.

## Scope

- Endpoint para abrir caja propia.
- Endpoint para consultar caja actual del usuario autenticado.
- Endpoint para cerrar caja propia.
- Endpoint para cerrar caja ajena por admin/superadmin.
- Validacion de entrada con contratos compartidos.
- Mapeo de errores de negocio a codigos HTTP consistentes.
- Registro de rutas bajo el prefijo de API correspondiente.

## Out Of Scope

- Venta POS, pagos, FEFO, anulacion de venta y carritos pendientes.
- UI, navegacion frontend o experiencia visual de caja.
- Reapertura o modificacion de cajas cerradas.
- Reportes administrativos de caja mas alla de la caja actual y cierre puntual.

## Acceptance Criteria

- `POST /api/cash-sessions/open` abre caja para el usuario autenticado y devuelve una caja con estado `open`.
- `GET /api/cash-sessions/current` devuelve `isOpen = false` cuando el usuario no tiene caja abierta y `isOpen = true` con detalle cuando si la tiene.
- `POST /api/cash-sessions/:id/close` permite cerrar caja propia al vendedor, admin o superadmin cuando corresponde.
- El cierre ajeno queda permitido solo para admin/superadmin y registra el usuario que realmente cierra.
- Las entradas usan `OpenCashSessionSchema` y `CloseCashSessionSchema`.
- Las respuestas exitosas usan `CashSessionSchema` o `CurrentCashSessionSchema`.
- Los errores esperados usan codigos claros para caja duplicada, caja inexistente, caja ya cerrada, cierre ajeno no autorizado y usuario autenticado faltante.
