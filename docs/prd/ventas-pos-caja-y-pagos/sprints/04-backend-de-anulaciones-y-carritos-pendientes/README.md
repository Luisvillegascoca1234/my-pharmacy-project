# Sprint 04 - Backend de Anulaciones y Carritos Pendientes

## Goal

Implementar el backend para anular ventas confirmadas mientras la caja asociada siga abierta y gestionar carritos pendientes sin reserva de stock, incluyendo expiracion, descarte, edicion, conversion a venta y supervision administrativa.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Las ventas confirmadas pueden anularse con motivo bajo reglas de rol, fecha y caja abierta, reponiendo inventario, revirtiendo pago y ajustando caja.
- Los carritos pendientes pueden guardarse, editarse, descartarse, expirar a 3 dias y convertirse en venta sin reservar stock ni congelar precio.
- La API, contratos, pruebas automatizadas y OpenAPI cubren anulaciones y pendientes. La UI quedo fuera de este sprint y fue abordada en sprints posteriores.

## Execution Order

### INFRA

5. [05-infra-add-shared-sale-cancellation-and-pending-cart-contracts.md](./05-infra-add-shared-sale-cancellation-and-pending-cart-contracts.md)

### BACKEND

1. [01-backend-implement-sale-cancellation-reversal-workflow.md](./01-backend-implement-sale-cancellation-reversal-workflow.md)
2. [02-backend-implement-pending-cart-lifecycle-rules.md](./02-backend-implement-pending-cart-lifecycle-rules.md)
3. [03-backend-add-cancellation-and-pending-cart-api-authorization.md](./03-backend-add-cancellation-and-pending-cart-api-authorization.md)
4. [04-backend-cover-cancellation-and-pending-cart-domain-rules.md](./04-backend-cover-cancellation-and-pending-cart-domain-rules.md)

### INFRA

6. [06-infra-document-cancellation-pending-cart-openapi-and-integration-wiring.md](./06-infra-document-cancellation-pending-cart-openapi-and-integration-wiring.md)
7. [07-infra-clean-up-touched-code-and-references.md](./07-infra-clean-up-touched-code-and-references.md)
8. [08-infra-run-validation-guardrails-on-affected-areas.md](./08-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint implementa solamente el backend de anulaciones y carritos pendientes: contratos, reglas transaccionales, permisos, API, pruebas automatizadas y OpenAPI minima. No implementa UI, navegacion, reportes, SIAT, QR, tarjeta, credito, reapertura de caja cerrada ni documentacion final de tesis.

Nota historica posterior al Sprint 09: la ausencia de UI en este sprint no es deuda vigente del epic; el cierre documental considera pendientes, anulacion y supervision como capacidades V1 reconciliadas dentro de los limites aprobados.
