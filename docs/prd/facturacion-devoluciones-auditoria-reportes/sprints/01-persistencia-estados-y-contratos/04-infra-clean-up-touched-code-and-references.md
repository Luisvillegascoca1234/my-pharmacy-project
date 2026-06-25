# Ticket 04 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 03
- Blocks: 05

## Description

Limpiar referencias obsoletas, nombres ambiguos y duplicaciones expuestas por la base de persistencia, contratos y OpenAPI del sprint. La limpieza debe concentrarse en evitar que factura preparada, comprobante interno, anulacion POS y devolucion administrativa queden mezclados por nombres o referencias inconsistentes.

## Scope

- Nombres de estados, contratos y referencias que puedan confundir `prepared invoice`, comprobante interno POS, anulacion y devolucion.
- Exports publicos agregados por el sprint.
- Referencias de OpenAPI, contratos y guardrails de generacion afectadas por los tickets 01 a 03.
- Notas de deuda diferida cuando una decision quede pendiente para servicios transaccionales o UI.

## Out Of Scope

- Limpieza amplia fuera del alcance del sprint.
- Cambios funcionales nuevos.
- Refactors de servicios, pantallas, navegacion o reportes que pertenecen a sprints posteriores.
- Documentacion operativa o tesis final.

## Acceptance Criteria

- No quedan referencias contradictorias entre factura preparada, comprobante interno POS, anulacion y devolucion administrativa.
- Los estados y contratos nuevos quedan exportados una sola vez desde la superficie publica correspondiente.
- Los nombres mantienen ingles en identificadores tecnicos y copy documental en espanol cuando aplique.
- La deuda diferida queda escrita como decision pendiente o alcance posterior, no como TODO accidental.
