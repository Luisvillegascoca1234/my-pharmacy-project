# Ticket 03 - Cover Cash Session Domain Rules

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 05

## Description

Agregar cobertura automatizada para las reglas de caja implementadas en este sprint. Las pruebas deben validar comportamiento externo y reglas de dominio, no detalles internos, para proteger apertura, consulta, cierre propio, cierre ajeno y calculos de caja.

## Scope

- Pruebas de apertura de caja.
- Pruebas de consulta de caja actual.
- Pruebas de cierre propio.
- Pruebas de cierre ajeno por admin/superadmin.
- Pruebas de errores de dominio y permisos.
- Dobles o fakes necesarios para aislar reglas de caja.

## Out Of Scope

- Pruebas de venta, pago, FEFO, anulacion y pendientes.
- Pruebas de UI o navegador.
- Pruebas exploratorias manuales.
- Pruebas exhaustivas de reportes historicos.

## Acceptance Criteria

- Hay prueba para apertura valida con monto inicial cero.
- Hay prueba para bloqueo de segunda caja abierta del mismo usuario.
- Hay prueba para `current` sin caja abierta y con caja abierta.
- Hay prueba para cierre propio con diferencia cero.
- Hay prueba para cierre propio con faltante y sobrante.
- Hay prueba para bloqueo de cierre de caja ajena por vendedor.
- Hay prueba para cierre de caja ajena por admin o superadmin.
- Hay prueba para bloqueo de cierre de caja ya cerrada.
- Hay prueba para auditoria de apertura y cierre.
- Las pruebas no dependen de ventas POS ni de datos reales de inventario.
