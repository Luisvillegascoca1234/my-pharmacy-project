# Ticket 08 - Clean Up Touched Code And References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05, 07
- Blocks: 09

## Description

Limpiar codigo muerto, duplicacion, referencias obsoletas, instrumentacion temporal y deriva de nombres expuesta por el trabajo de ventas POS y FEFO, enfocandose solo en lo tocado por este sprint.

## Scope

- contratos de venta/POS agregados en este sprint
- reglas backend de busqueda POS, venta, pago y FEFO
- helpers, mapeos, fakes y utilidades de prueba agregados
- OpenAPI y registro de rutas tocados por el sprint

## Out Of Scope

- limpieza amplia fuera de ventas POS y FEFO
- nuevas reglas funcionales
- refactors destinados a anulaciones, pendientes o UI
- cambios en caja salvo los necesarios para validar venta con caja abierta

## Acceptance Criteria

- no quedan contratos, helpers o fakes duplicados dentro del alcance tocado
- los nombres de errores, acciones de auditoria y tipos de movimiento son coherentes
- no quedan referencias a anulacion, pendientes, SIAT, QR o tarjeta como si estuvieran implementados
- cualquier deuda diferida queda documentada de forma explicita
