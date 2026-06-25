# Sprint 04 - Backend de Auditoria Reportes y CSV

## Goal

Implementar el backend ejecutable para auditoria consultable, reportes operativos iniciales y exportaciones CSV, usando ventas, devoluciones e inventario ya persistidos.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- superadmin puede consultar auditoria paginada con filtros y metadata completa sin exponerla a seller ni admin.
- admin y superadmin pueden consultar reportes de ventas diarias, valuacion de inventario y productos proximos a vencer con cortes operativos en America/La_Paz.
- admin y superadmin pueden exportar ventas e inventory movements en CSV con separador punto y coma, fechas ISO, filtros basicos y auditoria de descarga.

## Execution Order

### BACKEND

1. [01-backend-create-queryable-audit-module-routes-controller-repository-and-service.md](./01-backend-create-queryable-audit-module-routes-controller-repository-and-service.md)
2. [02-backend-implement-daily-sales-report-with-cancellations-returns-and-net-totals.md](./02-backend-implement-daily-sales-report-with-cancellations-returns-and-net-totals.md)
3. [03-backend-implement-inventory-valuation-and-expiring-products-reports.md](./03-backend-implement-inventory-valuation-and-expiring-products-reports.md)
4. [04-backend-implement-sales-and-inventory-movements-csv-exports-with-download-audit.md](./04-backend-implement-sales-and-inventory-movements-csv-exports-with-download-audit.md)
5. [05-backend-add-backend-tests-for-audit-reports-csv-and-permissions.md](./05-backend-add-backend-tests-for-audit-reports-csv-and-permissions.md)

### INFRA

6. [06-infra-align-audit-reports-exports-openapi-with-executable-endpoints.md](./06-infra-align-audit-reports-exports-openapi-with-executable-endpoints.md)
7. [07-infra-clean-up-touched-code-and-references.md](./07-infra-clean-up-touched-code-and-references.md)
8. [08-infra-run-validation-guardrails-on-affected-areas.md](./08-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint convierte auditoria consultable, reportes operativos iniciales y exportaciones CSV en endpoints backend ejecutables. El corte incluye `audit`, `reports` y `exports`, permisos por rol, filtros paginados, cortes diarios en `America/La_Paz`, calculos con ventas anuladas/devueltas y auditoria de descargas CSV.

No implementa pantallas administrativas, navegacion frontend, documentacion operativa final, evidencia de tesis ni reportes BI avanzados. Las consultas visuales de reportes no deben generar auditoria; solo las descargas CSV deben registrar evento de auditoria.
