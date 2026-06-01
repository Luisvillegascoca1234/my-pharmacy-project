# Ticket 05 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03, 04
- Blocks: 06

## Description

Limpiar codigo muerto, duplicacion, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo de caja, enfocandose solo en lo tocado por este sprint.

## Scope

- reglas de caja, API de caja y documentacion OpenAPI tocadas por el sprint
- helpers, exports y mapeos agregados para apertura/cierre
- fakes o utilidades de prueba agregadas para reglas de caja
- nombres de errores, acciones de auditoria y estados de caja

## Out Of Scope

- limpieza amplia fuera del alcance de caja
- nuevas reglas funcionales
- refactors destinados a ventas, pagos, FEFO o pendientes
- cambios de UI o navegacion

## Acceptance Criteria

- no quedan exports, helpers o fakes duplicados dentro del alcance de caja
- los nombres de errores y acciones de auditoria son coherentes y consistentes
- no quedan referencias a ventas, pagos, FEFO o pendientes como si ya estuvieran implementados
- cualquier deuda diferida queda documentada de forma explicita

## Deferred Debt

- La caja cierra usando el monto inicial como monto esperado mientras el flujo de venta POS no registre ingresos de caja. La integracion de ingresos, pagos en efectivo, anulaciones, FEFO y pendientes queda diferida para los sprints especificos de venta POS.
