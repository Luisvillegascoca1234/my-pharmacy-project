# Ticket 06 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 03, 05
- Blocks: 07

## Description

Limpiar codigo muerto, wiring duplicado, referencias obsoletas, helpers temporales y drift de nombres expuestos por las pruebas y la revision OpenAPI de este sprint. El foco debe limitarse a los paths tocados por la infraestructura de test, specs backend y documentacion API.

## Scope

- tests y utilidades agregadas en `backend`
- `backend/src/modules/suppliers`, `backend/src/modules/purchases` y `backend/src/modules/inventory` solo si fueron tocados por los tests
- `backend/src/docs/openapi.ts`
- scripts o configuracion backend agregada para pruebas
- referencias temporales creadas durante la cobertura

## Out Of Scope

- limpieza amplia fuera del PRD
- refactors de frontend o stores Zustand
- nuevas reglas de dominio
- cambios de persistencia no derivados de fallas verificadas

## Acceptance Criteria

- No queda codigo muerto obvio en los paths tocados por los tests y OpenAPI.
- No quedan fakes, factories o helpers duplicados sin razon clara.
- Imports, exports, scripts y nombres reflejan una forma coherente posterior al sprint.
- La deuda diferida queda documentada explicitamente con alcance y motivo.
- `typecheck` y el comando de tests definido por el sprint siguen siendo ejecutables.

## Execution Notes

- Removed the temporary backend runner smoke spec after the domain service specs became the executable coverage source.
- Kept shared service fakes centralized in `backend/src/tests/utils/service-fakes.ts` and tightened inventory fake call typing.
- Deferred debt: none identified inside the touched backend test, service, OpenAPI, or runner configuration paths.
