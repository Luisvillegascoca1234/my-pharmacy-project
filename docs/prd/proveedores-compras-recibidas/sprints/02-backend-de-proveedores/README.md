# Sprint 02 - Backend De Proveedores

## Goal

Implementar el modulo backend de proveedores con endpoints paginados, detalle, creacion, edicion, cambio de estado, permisos administrativos y auditoria, usando los contratos compartidos y la persistencia ya creada.

## Overall Status

- Status: DONE
- Owner: Unassigned
- External dependency: none

## Expected Result

By the end of this sprint:

- El backend expone rutas de proveedores para listar, consultar, crear y actualizar proveedores con validacion Zod compartida.
- Las reglas de NIT opcional unico, estado activo/inactivo, autorizacion por rol y auditoria quedan ubicadas en services y repositories siguiendo el mini-stack modular.

## Execution Order

### BACKEND

1. [01-backend-implement-suppliers-repository-and-service.md](./01-backend-implement-suppliers-repository-and-service.md)
2. [02-backend-add-suppliers-controllers-routes-and-authorization.md](./02-backend-add-suppliers-controllers-routes-and-authorization.md)

### INFRA

3. [03-infra-document-suppliers-openapi-and-integration-wiring.md](./03-infra-document-suppliers-openapi-and-integration-wiring.md)
4. [04-infra-clean-up-touched-code-and-references.md](./04-infra-clean-up-touched-code-and-references.md)
5. [05-infra-run-manual-qa-on-affected-areas.md](./05-infra-run-manual-qa-on-affected-areas.md)
6. [06-infra-update-thesis-with-sprint-evidence.md](./06-infra-update-thesis-with-sprint-evidence.md)

## Sprint Rule

Este sprint implementa solo el backend operativo de proveedores sobre la persistencia y contratos ya creados. Debe crear el mini-stack `suppliers` con repository, service, controller, routes, wiring en `apiRoutes`, permisos para `superadmin` y `admin`, respuestas paginadas y auditoria de creacion/actualizacion. No implementa compras, inventario, recepcion, anulacion de compras, frontend, stores Zustand, navegacion ni pantallas; esos cortes quedan para sprints posteriores del epic.
