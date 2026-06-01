# Ticket 06 - Document Cancellation Pending Cart OpenAPI And Integration Wiring

- Status: TODO
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03, 05
- Blocks: 07

## Description

Documentar la API minima de anulaciones y carritos pendientes, y conectar sus rutas al enrutamiento principal. La documentacion debe reflejar reglas de rol, caja abierta, expiracion y conversion sin adelantar UI ni fases fuera de alcance.

## Scope

- OpenAPI de anulacion de venta.
- OpenAPI de listado, guardado, edicion, descarte y conversion de pendientes.
- Schemas de request y response compartidos.
- Registro de prefijos de API necesarios.
- Errores principales de anulacion y pendientes.

## Out Of Scope

- Documentacion de UI.
- Documentacion final de tesis.
- QR, tarjeta, credito, SIAT o devoluciones.
- Verificacion manual de navegador.

## Acceptance Criteria

- OpenAPI lista `POST /api/sales/{id}/cancel`.
- OpenAPI lista endpoints de carritos pendientes definidos por el sprint.
- Cada endpoint documenta autenticacion y roles aplicables.
- Los schemas documentados coinciden con contratos compartidos.
- La API principal registra los prefijos esperados.
- Los errores principales quedan representados o descritos: caja cerrada, venta ya anulada, motivo invalido, pendiente expirado, pendiente ajeno y conversion rechazada.
