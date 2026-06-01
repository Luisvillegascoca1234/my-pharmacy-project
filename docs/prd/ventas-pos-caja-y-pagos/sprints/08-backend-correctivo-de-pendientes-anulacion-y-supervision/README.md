# Sprint 08 - Backend Correctivo de Pendientes Anulacion y Supervision

## Goal

Completar la API ejecutable pendiente para carritos pendientes, anulacion de ventas y supervision administrativa, cerrando las brechas que impidieron marcar el epic como DONE en el sprint 07.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- La API permite guardar, editar, listar, descartar, expirar y convertir carritos pendientes sin reservar stock ni congelar precio.
- La API permite anular ventas permitidas con motivo, revirtiendo pago, movimientos de inventario y esperado de caja de forma transaccional.
- Admin y superadmin cuentan con listados backend paginados para supervision de cajas, ventas y pendientes, con permisos y OpenAPI alineados.

## Execution Order

### BACKEND

1. [01-backend-implement-executable-pending-cart-lifecycle-api.md](./01-backend-implement-executable-pending-cart-lifecycle-api.md)
2. [02-backend-implement-sale-cancellation-reversal-api.md](./02-backend-implement-sale-cancellation-reversal-api.md)
3. [03-backend-implement-administrative-sales-cash-and-pending-supervision-lists.md](./03-backend-implement-administrative-sales-cash-and-pending-supervision-lists.md)
4. [04-backend-cover-pending-cancellation-and-supervision-regression-rules.md](./04-backend-cover-pending-cancellation-and-supervision-regression-rules.md)

### INFRA

5. [05-infra-reconcile-shared-contracts-openapi-and-frontend-integration-stubs.md](./05-infra-reconcile-shared-contracts-openapi-and-frontend-integration-stubs.md)
6. [06-infra-clean-up-corrective-backend-references.md](./06-infra-clean-up-corrective-backend-references.md)
7. [07-infra-run-validation-guardrails-for-corrective-backend.md](./07-infra-run-validation-guardrails-for-corrective-backend.md)

## Sprint Rule

Este sprint corrige solamente las brechas backend que bloquearon el cierre del epic en el Sprint 07: ciclo ejecutable de carritos pendientes, anulacion transaccional de ventas, pago revertido, movimientos inversos, ajuste neto de caja y listados administrativos de supervision. No implementa nuevas pantallas, reportes analiticos, SIAT, QR, tarjeta, credito, descuentos, cliente formal, reapertura de caja cerrada ni devoluciones posteriores al cierre.
