# Ticket 05 - Reconcile Shared Contracts OpenAPI And Frontend Integration Stubs

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 02, 03
- Blocks: 06

## Description

Reconciliar contratos compartidos, OpenAPI y clientes frontend existentes con la API ejecutable implementada en este sprint. Las notas de brecha que indicaban endpoints ausentes deben resolverse o reemplazarse por deuda real no bloqueante.

## Scope

- Contratos compartidos de venta cancelable, pago cancelable/revertido, pendientes y supervision.
- OpenAPI para pendientes, anulacion, listados de ventas, listados de caja y supervision.
- Clientes frontend que ya consumen o esperan rutas de pendientes, ventas, anulacion y supervision.
- Codigos de error de dominio para pendiente expirado, venta no anulable, caja cerrada, acceso denegado y stock insuficiente.
- Eliminacion o actualizacion de notas de brecha del Sprint 07 cuando la API ya sea ejecutable.

## Out Of Scope

- Cambios visuales.
- Nuevas reglas de producto.
- Documentacion de usuario final o tesis.
- OpenAPI exhaustiva fuera del alcance POS/caja/pagos.
- SIAT, QR, tarjeta, credito, reportes o descuentos.

## Acceptance Criteria

- Los contratos compartidos coinciden con requests y responses backend reales.
- OpenAPI ya no declara como ausentes las rutas implementadas en este sprint.
- Los clientes frontend compilan contra las rutas y tipos finales.
- Los codigos de error permiten que la UI distinga bloqueo por regla de dominio frente a error inesperado.
- Cualquier diferencia restante queda documentada como deuda no bloqueante o como bloqueo explicito del epic.
