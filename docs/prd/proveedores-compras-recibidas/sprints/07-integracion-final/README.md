# Sprint 07 - Integracion final

## Goal

Cerrar la integracion de proveedores y compras recibidas con navegacion, permisos visibles, resets de estado, estados operativos y validacion final del epic.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- Admin y superadmin navegan proveedores y compras desde sidebar y deep links con permisos coherentes, titulos correctos y resets sin estado cruzado.
- El epic queda listo para cierre despues de validar los flujos completos de proveedores, compras, recepcion y anulacion sobre la UI y API existentes.

## Arrastre de Cierre

El Sprint 07 dejo la validacion final bloqueada por frontend/backend locales inaccesibles durante el ticket 05. Ese bloqueo se traslado al Sprint 08 como antecedente de infraestructura; no confirma un fallo funcional del circuito farmaceutico ni habilita marcar el epic como `DONE`.

## Execution Order

### UI

1. [01-ui-ajustar-estados-visibles-y-deep-links-de-proveedores-y-compras.md](./01-ui-ajustar-estados-visibles-y-deep-links-de-proveedores-y-compras.md)

### INFRA

2. [02-infra-consolidar-navegacion-permisos-y-reset-de-sesion.md](./02-infra-consolidar-navegacion-permisos-y-reset-de-sesion.md)
3. [03-infra-validar-contratos-rutas-y-openapi-de-cierre.md](./03-infra-validar-contratos-rutas-y-openapi-de-cierre.md)
4. [04-infra-clean-up-touched-code-and-references.md](./04-infra-clean-up-touched-code-and-references.md)
5. [05-infra-run-manual-qa-on-affected-areas.md](./05-infra-run-manual-qa-on-affected-areas.md)
6. [06-infra-update-thesis-with-sprint-evidence.md](./06-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint prepara el cierre del epic de proveedores y compras recibidas con integracion final sobre lo ya implementado en los sprints 01 a 06. Debe revisar y ajustar solamente la superficie operativa existente: rutas `/suppliers`, `/suppliers/new`, `/suppliers/:id`, `/purchases`, `/purchases/new`, `/purchases/:id`, sidebar, titulos de ruta, visibilidad por rol, resets de sesion, estados de carga/error/vacio y documentacion tecnica minima.

No debe agregar reglas nuevas de negocio, modelos Prisma, migraciones, SIAT, pagos a proveedores, cuentas por pagar, kardex visual, stock por lote, POS, query params sincronizados ni refactors amplios fuera de las rutas y modulos de proveedores/compras. Si se detecta una brecha backend u OpenAPI, corregirla solo cuando sea inconsistencia contra el PRD ya aceptado; cualquier mejora nueva queda documentada como deuda futura.
