# Sprint 03 - Backend De Compras E Inventario

## Goal

Implementar el backend operativo de compras e inventario interno para crear borradores, editarlos de forma transaccional, recibir compras con capas y movimientos, anular compras con motivo y registrar auditoria.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El backend expone rutas de compras para listar, consultar, crear, editar, recibir y anular compras con autorizacion administrativa.
- La recepcion crea capas InventoryBatch y movimientos InventoryMovement dentro de una transaccion, y la anulacion de compras recibidas revierte solo capas intactas.

## Execution Order

### BACKEND

1. [01-backend-implement-purchases-repository-and-draft-service.md](./01-backend-implement-purchases-repository-and-draft-service.md)
2. [02-backend-add-inventory-layer-helpers-for-purchase-receipt-and-cancellation.md](./02-backend-add-inventory-layer-helpers-for-purchase-receipt-and-cancellation.md)
3. [03-backend-implement-purchase-receive-and-cancel-workflows.md](./03-backend-implement-purchase-receive-and-cancel-workflows.md)
4. [04-backend-add-purchases-controllers-routes-and-authorization.md](./04-backend-add-purchases-controllers-routes-and-authorization.md)

### INFRA

5. [05-infra-wire-purchases-openapi-and-backend-integration.md](./05-infra-wire-purchases-openapi-and-backend-integration.md)
6. [06-infra-clean-up-touched-code-and-references.md](./06-infra-clean-up-touched-code-and-references.md)
7. [07-infra-run-manual-qa-on-affected-areas.md](./07-infra-run-manual-qa-on-affected-areas.md)
8. [08-infra-update-thesis-with-sprint-evidence.md](./08-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint implementa solo el backend operativo de compras e inventario interno sobre los contratos y modelos ya creados. Debe crear el mini-stack `purchases`, helpers internos de `inventory`, endpoints administrativos, transacciones de borrador/recepcion/anulacion, movimientos, capas y auditoria. No implementa frontend, stores Zustand, navegacion, pantallas de proveedores/compras, sincronizacion de filtros, SIAT, pagos, cuentas por pagar, stock visual, kardex visual, FEFO de ventas ni pruebas exhaustivas fuera del backend tocado.
