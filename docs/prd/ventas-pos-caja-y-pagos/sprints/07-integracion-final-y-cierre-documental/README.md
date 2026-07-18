# Sprint 07 - Integracion Final y Cierre Documental

## Goal

Cerrar la integracion del flujo de ventas POS, caja y pagos con permisos visibles, contratos, OpenAPI, validaciones tecnicas y documentacion operativa farmaceutica, sin agregar nuevas reglas comerciales fuera del PRD.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Las reglas de caja, venta, pago efectivo, FEFO, pendientes, anulacion y supervision quedan reconciliadas entre experiencia de usuario, contratos y documentacion minima de API.
- La documentacion operativa explica el flujo de mostrador con terminologia farmaceutica, limites de V1 y responsabilidades por rol.
- Las brechas historicas de pendientes, anulacion y supervision quedaron resueltas por el correctivo posterior y reconciliadas en el cierre documental.

## Execution Order

### UI

1. [01-ui-reconcile-visible-permissions-and-operational-states.md](./01-ui-reconcile-visible-permissions-and-operational-states.md)

### BACKEND

2. [02-backend-consolidate-sales-cash-domain-regression-coverage.md](./02-backend-consolidate-sales-cash-domain-regression-coverage.md)

### INFRA

3. [03-infra-verify-openapi-shared-contracts-and-route-parity.md](./03-infra-verify-openapi-shared-contracts-and-route-parity.md)
4. [04-infra-update-pharmaceutical-workflow-documentation.md](./04-infra-update-pharmaceutical-workflow-documentation.md)
5. [05-infra-clean-up-final-integration-references.md](./05-infra-clean-up-final-integration-references.md)
6. [06-infra-run-final-validation-guardrails-and-close-epic.md](./06-infra-run-final-validation-guardrails-and-close-epic.md)

## Sprint Rule

Este sprint cierra el epic de ventas POS, caja y pagos sobre el trabajo ya completado en los sprints 01 a 06. Debe reconciliar permisos visibles, estados operativos, contratos, OpenAPI, pruebas de dominio y documentacion operativa farmaceutica. No debe agregar nuevos medios de pago, facturacion SIAT, cliente formal con NIT, descuentos, cantidades decimales, reportes analiticos, reapertura de caja cerrada, devoluciones posteriores a cierre ni reglas comerciales fuera del PRD aceptado.

Nota historica posterior al Sprint 09: este sprint quedo complementado por el correctivo backend del Sprint 08 y por el cierre documental del Sprint 09; el epic ya no mantiene brechas vigentes sobre API ejecutable de pendientes, anulacion ni supervision.
