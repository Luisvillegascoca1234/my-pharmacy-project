# Sprint 06 - UI de Reportes Exportaciones y Auditoria

## Goal

Integrar las pantallas administrativas de reportes, exportaciones CSV y auditoria consultable con rutas, permisos y modulos frontend portables.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Admin y superadmin consultan ventas diarias, valuacion de inventario y productos proximos a vencer con filtros operativos y estados claros.
- Admin y superadmin descargan CSV de ventas y movimientos con filtros de fecha, separador regional y retroalimentacion visible de descarga.
- Superadmin consulta auditoria paginada con filtros y metadata colapsable, mientras seller queda fuera de las superficies administrativas.

## Execution Order

### UI

1. [01-ui-create-reports-exports-and-audit-frontend-data-modules.md](./01-ui-create-reports-exports-and-audit-frontend-data-modules.md)
2. [02-ui-build-operational-reports-page-with-daily-sales-valuation-and-expirations.md](./02-ui-build-operational-reports-page-with-daily-sales-valuation-and-expirations.md)
3. [03-ui-build-csv-exports-page-with-filters-downloads-and-audit-aware-states.md](./03-ui-build-csv-exports-page-with-filters-downloads-and-audit-aware-states.md)
4. [04-ui-build-audit-log-page-with-filters-pagination-and-metadata-disclosure.md](./04-ui-build-audit-log-page-with-filters-pagination-and-metadata-disclosure.md)
5. [05-ui-wire-analysis-navigation-route-titles-and-access-states.md](./05-ui-wire-analysis-navigation-route-titles-and-access-states.md)
6. [06-ui-add-frontend-tests-for-reports-exports-audit-permissions-and-errors.md](./06-ui-add-frontend-tests-for-reports-exports-audit-permissions-and-errors.md)

### INFRA

7. [07-infra-align-analysis-placeholders-and-route-titles-for-reports-exports-audit.md](./07-infra-align-analysis-placeholders-and-route-titles-for-reports-exports-audit.md)
8. [08-infra-clean-up-touched-code-and-references.md](./08-infra-clean-up-touched-code-and-references.md)
9. [09-infra-run-validation-guardrails-on-affected-areas.md](./09-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint convierte las superficies de analisis del epic en UI operativa: reportes, exportaciones CSV y auditoria consultable. El trabajo debe consumir los contratos y endpoints ya definidos para ventas diarias, valuacion por lote, proximos vencimientos, CSV de ventas, CSV de movimientos y auditoria paginada.

El sprint no agrega reglas backend nuevas, no cambia facturacion preparada ni devoluciones administrativas ya cerradas, no actualiza documentacion operativa ni tesis, y no planifica QA manual. Los modulos frontend creados bajo `frontend/src/modules` deben seguir siendo portables: sin JSX, copy visible, rutas, iconos, estilos, imports de UI ni dependencias DOM.
