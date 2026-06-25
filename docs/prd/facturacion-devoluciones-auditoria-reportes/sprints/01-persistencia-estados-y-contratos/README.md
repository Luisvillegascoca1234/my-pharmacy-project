# Sprint 01 - Persistencia, Estados y Contratos

## Goal

Establecer la base destructiva permitida de persistencia, estados, contratos compartidos y OpenAPI inicial para facturacion preparada, devoluciones totales, auditoria consultable, reportes y exportaciones.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Prisma contiene enums, modelos, relaciones, indices y restricciones base para facturas preparadas, devoluciones totales, venta devuelta, pago devuelto y movimiento sale_returned.
- Los contratos compartidos definen payloads, filtros, respuestas paginadas y envelopes de reportes/exportaciones para los modulos administrativos posteriores.
- OpenAPI y guardrails de generacion quedan alineados para que los sprints backend implementen services transaccionales sin redisenar contratos.

## Execution Order

### BACKEND

1. [01-backend-model-prepared-invoice-sale-return-status-and-inventory-movement-persistence.md](./01-backend-model-prepared-invoice-sale-return-status-and-inventory-movement-persistence.md)

### INFRA

2. [02-infra-add-shared-administrative-closure-contracts-and-pagination-schemas.md](./02-infra-add-shared-administrative-closure-contracts-and-pagination-schemas.md)
3. [03-infra-wire-openapi-base-and-generation-guardrails.md](./03-infra-wire-openapi-base-and-generation-guardrails.md)
4. [04-infra-clean-up-touched-code-and-references.md](./04-infra-clean-up-touched-code-and-references.md)
5. [05-infra-run-validation-guardrails-on-affected-areas.md](./05-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint solo establece la base de persistencia, estados, contratos compartidos, OpenAPI inicial y guardrails de generacion para el cierre administrativo posterior a ventas POS. No implementa endpoints ejecutables, reglas transaccionales de facturacion o devolucion, reportes calculados, descargas CSV reales, pantallas administrativas, navegacion ni documentacion operativa final; esos cortes quedan para los siguientes sprints del epic.

La migracion puede ser destructiva en este alcance porque el PRD asume ausencia de usuarios activos. La base debe mantener separadas la factura preparada, la venta POS, la anulacion con caja abierta y la devolucion administrativa posterior al cierre.
