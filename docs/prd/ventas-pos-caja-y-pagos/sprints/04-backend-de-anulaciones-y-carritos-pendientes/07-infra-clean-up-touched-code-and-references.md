# Ticket 07 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04, 06
- Blocks: 08

## Description

Limpiar codigo muerto, duplicacion, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo de anulaciones y carritos pendientes, enfocandose solo en lo tocado por este sprint.

## Scope

- contratos de anulacion y pendientes
- reglas backend de reversa de venta y ciclo de pendientes
- helpers, mapeos, fakes y utilidades de prueba agregados
- OpenAPI y registro de API tocados por el sprint

## Out Of Scope

- limpieza amplia fuera de anulaciones y pendientes
- nuevas reglas funcionales
- refactors destinados a UI, reportes o tesis
- cambios en venta confirmada que no sean necesarios para reversa o conversion

## Acceptance Criteria

- no quedan contratos, helpers o fakes duplicados dentro del alcance tocado
- los nombres de estados, errores, acciones de auditoria y movimientos son coherentes
- no quedan referencias a UI, SIAT, QR, tarjeta o credito como si estuvieran implementados
- cualquier deuda diferida queda documentada de forma explicita

## Historical Reconciliation

- Estado reconciliado durante Sprint 09: las referencias antiguas de este sprint quedan cerradas como historial y la deuda real posterior se traslado al cierre documental del Sprint 09.
