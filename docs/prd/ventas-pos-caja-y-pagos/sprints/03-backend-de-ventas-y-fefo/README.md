# Sprint 03 - Backend de Ventas y FEFO

## Goal

Implementar el backend de venta POS pagada en efectivo: busqueda de productos vendibles, validacion de caja abierta, creacion transaccional de venta, pago, descuento FEFO, movimientos de salida y margen por lote.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El backend expone busqueda POS de productos activos con stock vendible y datos de proximo vencimiento.
- Una venta confirmada exige caja abierta, cobra en efectivo, descuenta inventario por FEFO y genera pago, movimientos y comprobante interno.
- Las reglas de venta, pago efectivo, stock insuficiente, FEFO y margen quedan cubiertas con pruebas automatizadas y OpenAPI minima.

## Execution Order

### INFRA

6. [06-infra-add-shared-sales-pos-contracts.md](./06-infra-add-shared-sales-pos-contracts.md)

### BACKEND

1. [01-backend-implement-pos-product-search-and-availability.md](./01-backend-implement-pos-product-search-and-availability.md)
2. [02-backend-implement-fefo-sale-allocation-and-inventory-movements.md](./02-backend-implement-fefo-sale-allocation-and-inventory-movements.md)
3. [03-backend-implement-sales-transaction-payment-and-receipt.md](./03-backend-implement-sales-transaction-payment-and-receipt.md)
4. [04-backend-add-sales-api-and-authorization.md](./04-backend-add-sales-api-and-authorization.md)
5. [05-backend-cover-sales-payment-and-fefo-domain-rules.md](./05-backend-cover-sales-payment-and-fefo-domain-rules.md)

### INFRA

7. [07-infra-document-sales-pos-openapi-and-integration-wiring.md](./07-infra-document-sales-pos-openapi-and-integration-wiring.md)
8. [08-infra-clean-up-touched-code-and-references.md](./08-infra-clean-up-touched-code-and-references.md)
9. [09-infra-run-validation-guardrails-on-affected-areas.md](./09-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint implementa solamente el backend de venta POS confirmada: contratos de venta/POS, busqueda de productos vendibles, validacion de caja abierta, pago efectivo, descuento FEFO, movimientos de salida, margen, comprobante interno, API, pruebas automatizadas y OpenAPI minima. No implementa anulacion de ventas, carritos pendientes, UI, navegacion, QR, tarjeta, credito, SIAT ni documentacion final de tesis.
