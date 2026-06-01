# Ticket 04 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 03
- Blocks: 05

## Description

Limpiar codigo muerto, exports duplicados, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo del sprint, enfocandose solo en lo tocado por contratos, persistencia y guardrails de generacion.

## Scope

- schemas, tipos, exports y contratos tocados por el sprint
- enums, modelos, relaciones e indices agregados para caja, ventas, pagos y pendientes
- migraciones, generacion y referencias operativas tocadas por el sprint
- notas temporales o nombres inconsistentes introducidos durante el modelado

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- API ejecutable, pantallas o nuevas reglas funcionales
- refactors destinados a sprints posteriores
- cambios en proveedores, compras o inventario que no sean necesarios para integrar salidas de venta

## Acceptance Criteria

- no quedan schemas, tipos o exports duplicados dentro del alcance tocado
- los nombres de estados, modelos y contratos son coherentes con PRD y decisiones
- no quedan referencias a metodos de pago, SIAT, descuentos o cliente formal como si fueran parte de V1
- la deuda diferida queda documentada de forma explicita en vez de quedar como comentario accidental

## Evidencia de cierre

- Se alinearon los contratos de consumos FEFO con el costo base de lote usado para margen operativo.
- Los tipos de movimiento de inventario incluyen venta confirmada y reversa por anulacion para mantener trazabilidad de salida.
- No se detecto deuda diferida accidental dentro del alcance de contratos, persistencia y guardrails del sprint.
