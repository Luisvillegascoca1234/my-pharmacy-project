# Sprint 02 - Backend de Facturacion Preparada

## Goal

Implementar el backend ejecutable de facturacion preparada interna, manteniendo la separacion entre venta POS, comprobante interno y factura preparada sin SIAT real.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- admin y superadmin pueden listar ventas facturables, preparar facturas internas, listar facturas, consultar detalle y cancelar facturas preparadas con motivo.
- seller queda bloqueado de facturacion preparada y las reglas de elegibilidad impiden facturar ventas anuladas, devueltas o con factura preparada activa.
- La facturacion preparada genera correlativos internos, snapshots de venta, historial de cancelaciones, auditoria y pruebas automatizadas de reglas criticas.

## Execution Order

### BACKEND

1. [01-backend-create-prepared-invoice-billing-module-routes-controller-and-repository.md](./01-backend-create-prepared-invoice-billing-module-routes-controller-and-repository.md)
2. [02-backend-implement-prepared-invoice-eligibility-and-creation-service-rules.md](./02-backend-implement-prepared-invoice-eligibility-and-creation-service-rules.md)
3. [03-backend-implement-prepared-invoice-listing-detail-and-cancellation-lifecycle.md](./03-backend-implement-prepared-invoice-listing-detail-and-cancellation-lifecycle.md)
4. [04-backend-add-prepared-invoice-backend-tests-for-permissions-eligibility-and-audit.md](./04-backend-add-prepared-invoice-backend-tests-for-permissions-eligibility-and-audit.md)

### INFRA

5. [05-infra-align-billing-openapi-implementation-notes-with-executable-endpoints.md](./05-infra-align-billing-openapi-implementation-notes-with-executable-endpoints.md)
6. [06-infra-clean-up-touched-code-and-references.md](./06-infra-clean-up-touched-code-and-references.md)
7. [07-infra-run-validation-guardrails-on-affected-areas.md](./07-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint convierte la facturacion preparada planificada en endpoints backend ejecutables bajo `billing`, usando los contratos compartidos ya creados y manteniendo la factura preparada como documento interno sin SIAT real. El corte incluye ventas facturables, preparacion de factura, listado, detalle, cancelacion con motivo, permisos administrativos, auditoria y pruebas automatizadas de reglas criticas.

No implementa devoluciones totales, reposicion de lotes, pago `refunded`, reportes, CSV, auditoria consultable, pantallas administrativas, navegacion frontend ni documentacion operativa final. La devolucion administrativa queda para el siguiente sprint backend y solo debe considerarse como bloqueo de elegibilidad cuando la venta ya este marcada `returned`.
