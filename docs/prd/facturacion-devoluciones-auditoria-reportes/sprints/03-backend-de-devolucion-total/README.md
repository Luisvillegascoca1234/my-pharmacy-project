# Sprint 03 - Backend de Devolucion Total

## Goal

Implementar el backend ejecutable de devolucion administrativa total, separado de anulacion POS y facturacion preparada, con transaccion de venta, pago, lotes, movimientos y auditoria.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- admin y superadmin pueden listar ventas devolvibles, registrar una devolucion total permitida, listar devoluciones y consultar detalle con snapshot por item y lote.
- Las reglas bloquean venta anulada, ya devuelta, caja abierta anulable, pago no reembolsable y factura preparada activa; una factura cancelada no bloquea la devolucion.
- La devolucion marca venta returned, pago refunded, repone stock a los lotes originales, crea movimientos sale_returned y registra auditoria con pruebas automatizadas.

## Execution Order

### BACKEND

1. [01-backend-create-sale-returns-module-routes-controller-repository-and-route-wiring.md](./01-backend-create-sale-returns-module-routes-controller-repository-and-route-wiring.md)
2. [02-backend-implement-returnable-sale-eligibility-and-blocker-rules.md](./02-backend-implement-returnable-sale-eligibility-and-blocker-rules.md)
3. [03-backend-implement-total-sale-return-transaction-with-lot-restoration-and-refund-state.md](./03-backend-implement-total-sale-return-transaction-with-lot-restoration-and-refund-state.md)
4. [04-backend-implement-sale-return-listing-detail-mapping-and-audit-metadata.md](./04-backend-implement-sale-return-listing-detail-mapping-and-audit-metadata.md)
5. [05-backend-add-sale-return-backend-tests-for-blockers-transaction-and-inventory-traceability.md](./05-backend-add-sale-return-backend-tests-for-blockers-transaction-and-inventory-traceability.md)

### INFRA

6. [06-infra-align-returns-openapi-implementation-notes-with-executable-endpoints.md](./06-infra-align-returns-openapi-implementation-notes-with-executable-endpoints.md)
7. [07-infra-clean-up-touched-code-and-references.md](./07-infra-clean-up-touched-code-and-references.md)
8. [08-infra-run-validation-guardrails-on-affected-areas.md](./08-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint convierte las devoluciones administrativas totales en endpoints backend ejecutables bajo `returns`. El corte incluye ventas devolvibles, reglas de elegibilidad, registro transaccional de devolucion total, restauracion de lotes originales, movimientos `sale_returned`, pago `refunded`, venta `returned`, auditoria, listado, detalle y pruebas automatizadas.

No implementa devoluciones parciales, reapertura o modificacion de cierres de caja, reportes, CSV, auditoria consultable, pantallas administrativas, navegacion frontend ni documentacion operativa final. La anulacion POS sigue siendo el flujo correcto cuando la caja esta abierta y la venta todavia es anulable.
