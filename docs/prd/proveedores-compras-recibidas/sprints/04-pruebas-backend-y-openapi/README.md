# Sprint 04 - Pruebas Backend Y OpenAPI

## Goal

Agregar cobertura backend enfocada en reglas de proveedores, compras e inventario recibido, y cerrar la paridad minima de OpenAPI con los endpoints implementados.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El backend cuenta con un runner de pruebas y utilidades suficientes para probar services sin Express ni base real cuando corresponda.
- Las reglas criticas de proveedores, compras en borrador, recepcion, anulacion, movimientos y auditoria quedan cubiertas por pruebas enfocadas.
- OpenAPI queda revisado contra los contratos y endpoints reales de suppliers y purchases antes de pasar a frontend.

## Execution Order

### INFRA

4. [04-infra-configure-backend-test-runner-and-service-test-utilities.md](./04-infra-configure-backend-test-runner-and-service-test-utilities.md)
5. [05-infra-verify-openapi-contract-parity-for-suppliers-and-purchases.md](./05-infra-verify-openapi-contract-parity-for-suppliers-and-purchases.md)
6. [06-infra-clean-up-touched-code-and-references.md](./06-infra-clean-up-touched-code-and-references.md)
7. [07-infra-run-manual-qa-on-affected-areas.md](./07-infra-run-manual-qa-on-affected-areas.md)
8. [08-infra-update-thesis-with-sprint-evidence.md](./08-infra-update-thesis-with-sprint-evidence.md)

### BACKEND

1. [01-backend-cover-suppliers-service-rules.md](./01-backend-cover-suppliers-service-rules.md)
2. [02-backend-cover-purchases-draft-and-validation-rules.md](./02-backend-cover-purchases-draft-and-validation-rules.md)
3. [03-backend-cover-purchase-receipt-cancellation-and-inventory-rules.md](./03-backend-cover-purchase-receipt-cancellation-and-inventory-rules.md)

## Sprint Rule

Este sprint agrega infraestructura de pruebas y cobertura backend enfocada sobre lo ya implementado en proveedores, compras e inventario interno. Debe mantener los tests cerca del comportamiento externo de services y contratos, sin reescribir la arquitectura ni mezclar frontend, stores Zustand, rutas de UI, pantallas de proveedores/compras, inventario visual, SIAT, pagos, cuentas por pagar, POS, FEFO de ventas ni nuevas funcionalidades de dominio. OpenAPI solo se ajusta para reflejar endpoints y schemas reales existentes.
