# Ticket 04 - Document Cash Session OpenAPI And Integration Wiring

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 05

## Description

Documentar la API minima de caja y conectar el flujo backend al enrutamiento general de la aplicacion. Este ticket deja visible para integracion futura que caja ya expone apertura, consulta y cierre sin mezclar todavia venta POS.

## Scope

- OpenAPI para apertura de caja.
- OpenAPI para caja actual.
- OpenAPI para cierre de caja.
- Schemas compartidos de request y response usados por caja.
- Registro del prefijo de caja dentro de la API principal.
- Revision de permisos documentados para vendedor, admin y superadmin.

## Out Of Scope

- Documentar ventas, pagos, FEFO, anulacion de venta o pendientes.
- Crear documentacion de usuario final o tesis.
- Cambiar contratos compartidos salvo ajustes menores descubiertos por integracion.
- QA manual de UI.

## Acceptance Criteria

- OpenAPI lista `POST /api/cash-sessions/open`.
- OpenAPI lista `GET /api/cash-sessions/current`.
- OpenAPI lista `POST /api/cash-sessions/{id}/close`.
- Cada endpoint documenta autenticacion requerida y roles aplicables.
- Los schemas documentados coinciden con los contratos compartidos.
- La API principal registra el modulo de caja bajo el prefijo esperado.
- Los errores principales quedan representados o descritos: caja duplicada, caja no encontrada, caja cerrada y cierre ajeno no autorizado.
