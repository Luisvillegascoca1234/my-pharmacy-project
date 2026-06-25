# Sprint 05 - UI de Facturas y Devoluciones

## Goal

Implementar las superficies administrativas de facturas preparadas y devoluciones totales, consumiendo los endpoints backend ya ejecutables sin mezclar UI dentro de modulos portables.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- admin y superadmin pueden listar ventas facturables, preparar facturas internas, listar facturas, abrir detalle y cancelar facturas preparadas con motivo.
- admin y superadmin pueden listar ventas devolvibles, registrar devolucion total, listar devoluciones y consultar detalle con errores claros para bloqueos esperados.
- La navegacion muestra facturas preparadas y devoluciones como superficies administrativas separadas, manteniendo seller fuera de estos flujos.

## Execution Order

### UI

1. [01-ui-create-administrative-closure-frontend-data-modules-for-invoices-and-returns.md](./01-ui-create-administrative-closure-frontend-data-modules-for-invoices-and-returns.md)
2. [02-ui-build-prepared-invoices-page-with-filters-detail-create-and-cancel-flows.md](./02-ui-build-prepared-invoices-page-with-filters-detail-create-and-cancel-flows.md)
3. [03-ui-build-total-sale-returns-page-with-returnable-sales-detail-and-reason-modal.md](./03-ui-build-total-sale-returns-page-with-returnable-sales-detail-and-reason-modal.md)
4. [04-ui-wire-administrative-navigation-routes-and-access-states-for-invoices-and-returns.md](./04-ui-wire-administrative-navigation-routes-and-access-states-for-invoices-and-returns.md)
5. [05-ui-add-frontend-hook-facade-store-tests-for-invoices-returns-and-expected-errors.md](./05-ui-add-frontend-hook-facade-store-tests-for-invoices-returns-and-expected-errors.md)

### INFRA

6. [06-infra-align-frontend-placeholders-and-route-titles-for-administrative-closure-surfaces.md](./06-infra-align-frontend-placeholders-and-route-titles-for-administrative-closure-surfaces.md)
7. [07-infra-clean-up-touched-code-and-references.md](./07-infra-clean-up-touched-code-and-references.md)
8. [08-infra-run-validation-guardrails-on-affected-areas.md](./08-infra-run-validation-guardrails-on-affected-areas.md)

## Sprint Rule

Este sprint convierte facturas preparadas y devoluciones totales en superficies administrativas frontend ejecutables. El corte incluye modulos portables de datos, paginas de facturas y devoluciones, filtros, detalle, modales de motivo, acciones permitidas, navegacion y estados de error esperados.

No implementa reportes, exportaciones, auditoria consultable, documentacion operativa final ni evidencia de tesis. Los modulos bajo `frontend/src/modules` no deben contener JSX, copy visible, rutas, iconos, estilos ni dependencias de UI; las paginas y componentes se encargan de la experiencia visual.
