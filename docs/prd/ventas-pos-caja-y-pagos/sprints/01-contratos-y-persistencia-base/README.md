# Sprint 01 - Contratos y Persistencia Base

## Goal

Establecer los contratos compartidos, estados operativos y persistencia base de caja, ventas, pagos, consumos FEFO y carritos pendientes para desbloquear las reglas transaccionales posteriores.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Los schemas compartidos definen caja, ventas, pagos, anulacion, busqueda POS y carritos pendientes con tipos exportados desde @pharmacy-pos/shared.
- Prisma contiene enums, modelos, relaciones, indices y restricciones base para sesiones de caja, ventas, pagos, consumos por lote y carritos pendientes.
- La migracion y la generacion de Prisma quedan documentadas como guardrails antes de implementar operaciones transaccionales.

## Execution Order

### INFRA

2. [02-infra-add-shared-cash-sales-pos-and-pending-cart-schemas.md](./02-infra-add-shared-cash-sales-pos-and-pending-cart-schemas.md)

### BACKEND

1. [01-backend-model-cash-sale-payment-and-pending-cart-persistence.md](./01-backend-model-cash-sale-payment-and-pending-cart-persistence.md)

### INFRA

3. [03-infra-generate-migration-and-prisma-client-guardrails.md](./03-infra-generate-migration-and-prisma-client-guardrails.md)
4. [04-infra-clean-up-touched-code-and-references.md](./04-infra-clean-up-touched-code-and-references.md)
5. [05-infra-run-validation-guardrails-on-affected-areas.md](./05-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint solo define contratos compartidos, estados operativos, persistencia y guardrails de generacion para caja, ventas, pagos, consumos FEFO y carritos pendientes. No implementa API ejecutable, pantallas POS, cierre real de caja, cobro operativo, anulacion ejecutable, navegacion ni documentacion final de tesis; esos cortes quedan para los siguientes sprints del epic.
