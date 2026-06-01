# Sprint 06 - UI de Pendientes Anulacion y Supervision

## Goal

Implementar la experiencia frontend avanzada para carritos pendientes, detalle de venta, anulacion con motivo, cierre de caja ajena y supervision administrativa, completando el flujo operativo posterior al POS base sin incorporar reportes ni facturacion fiscal.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El vendedor puede guardar, listar, retomar, editar, descartar y cobrar carritos pendientes propios con advertencias de expiracion, precio y stock.
- El vendedor puede consultar ventas propias recientes y anular ventas permitidas con motivo mientras la caja asociada siga abierta.
- Admin y superadmin pueden supervisar ventas, cajas y pendientes de todos, cerrar caja ajena y ejecutar anulaciones permitidas.

## Execution Order

### UI

1. [01-ui-build-advanced-sales-pending-and-supervision-data-modules.md](./01-ui-build-advanced-sales-pending-and-supervision-data-modules.md)
2. [02-ui-add-pending-cart-flow-to-pos.md](./02-ui-add-pending-cart-flow-to-pos.md)
3. [03-ui-build-sale-detail-and-cancellation-flow.md](./03-ui-build-sale-detail-and-cancellation-flow.md)
4. [04-ui-build-administrative-cash-sales-and-pending-supervision.md](./04-ui-build-administrative-cash-sales-and-pending-supervision.md)

### INFRA

5. [05-infra-wire-advanced-pos-routes-permissions-and-session-resets.md](./05-infra-wire-advanced-pos-routes-permissions-and-session-resets.md)
6. [06-infra-clean-up-advanced-pos-ui-references.md](./06-infra-clean-up-advanced-pos-ui-references.md)
7. [07-infra-run-validation-guardrails-on-advanced-pos-ui-areas.md](./07-infra-run-validation-guardrails-on-advanced-pos-ui-areas.md)

## Sprint Rule

Este sprint implementa solamente la experiencia avanzada de ventas POS: carritos pendientes con expiracion a 3 dias, detalle de venta, anulacion con motivo, supervision por rol, cierre de caja ajena y estados visibles de autorizacion. No implementa reportes analiticos, SIAT, QR, tarjeta, credito, devoluciones posteriores a cierre, reapertura de caja cerrada, reasignacion de pendientes, reserva de stock ni documentacion final de tesis.
