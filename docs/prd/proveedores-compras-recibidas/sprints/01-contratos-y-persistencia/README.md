# Sprint 01 - Contratos y Persistencia

## Goal

Establecer los contratos compartidos y la persistencia base de proveedores, compras e inventario para desbloquear los módulos backend transaccionales de los siguientes sprints.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Los schemas compartidos definen proveedores, compras, items, recepcion, anulacion y paginacion con tipos exportados desde @pharmacy-pos/shared.
- Prisma contiene los enums, modelos, relaciones, indices y restricciones base para proveedores, compras, capas de inventario y movimientos.
- La migracion y la generacion de Prisma quedan documentadas y listas para que los services de compras puedan operar sobre una base consistente.

## Execution Order

### INFRA

2. [02-infra-add-shared-contracts-and-pagination-schemas.md](./02-infra-add-shared-contracts-and-pagination-schemas.md)

### BACKEND

1. [01-backend-model-supplier-purchase-and-inventory-persistence.md](./01-backend-model-supplier-purchase-and-inventory-persistence.md)

### INFRA

3. [03-infra-generate-migration-and-prisma-client-guardrails.md](./03-infra-generate-migration-and-prisma-client-guardrails.md)
4. [04-infra-clean-up-touched-code-and-references.md](./04-infra-clean-up-touched-code-and-references.md)
5. [05-infra-run-manual-qa-on-affected-areas.md](./05-infra-run-manual-qa-on-affected-areas.md)
6. [06-infra-update-thesis-with-sprint-evidence.md](./06-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint solo define contratos compartidos, persistencia y guardrails de generación para proveedores, compras recibidas, capas de inventario y movimientos. No implementa endpoints, services, repositories, pantallas, stores Zustand, navegación, recepción transaccional, anulación operativa ni OpenAPI completo; esos cortes quedan para los sprints posteriores del epic.
