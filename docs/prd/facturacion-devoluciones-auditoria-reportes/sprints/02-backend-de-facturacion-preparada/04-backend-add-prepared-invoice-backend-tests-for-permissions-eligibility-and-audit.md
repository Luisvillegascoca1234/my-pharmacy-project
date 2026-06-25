# Ticket 04 - Add prepared invoice backend tests for permissions, eligibility and audit

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 03
- Blocks: 06

## Description

Agregar pruebas automatizadas enfocadas en reglas de dominio y contratos HTTP del backend de facturacion preparada. Las pruebas deben cubrir comportamiento observable sin depender de detalles internos innecesarios.

## Scope

- Pruebas de service con repository falso para elegibilidad, creacion, cancelacion, historial y auditoria.
- Pruebas de controller/rutas cuando sean utiles para validar permisos `admin` / `superadmin` y bloqueo de `seller`.
- Casos de venta elegible, venta anulada, venta devuelta, factura activa, factura cancelada previa y factura inexistente.
- Casos de motivo invalido, cancelacion exitosa y cancelacion duplicada.
- Verificacion de metadata de auditoria para preparacion y cancelacion.
- Verificacion de que venta, pago, caja e inventario no se modifican durante facturacion preparada.

## Out Of Scope

- Pruebas de devolucion total, reportes, CSV, auditoria consultable y UI.
- Pruebas end-to-end de navegador.
- Seed amplio de datos no necesario para las reglas del modulo.

## Acceptance Criteria

- Las pruebas automatizadas fallan si `seller` puede operar facturacion preparada.
- Las pruebas automatizadas fallan si una venta invalida puede facturarse.
- Las pruebas automatizadas fallan si una factura activa puede duplicarse.
- Las pruebas automatizadas prueban que una factura cancelada no bloquea una nueva factura sobre la venta vigente.
- Las pruebas automatizadas prueban auditoria de preparacion y cancelacion.
- Los comandos de validacion backend relevantes quedan documentados en el ticket de cierre.

## Cierre

- Se agrego cobertura automatizada para permisos `admin` / `superadmin` y bloqueo de `seller` en facturacion preparada.
- Se agrego cobertura para venta elegible, venta anulada, venta devuelta, factura activa, factura cancelada previa, factura inexistente, motivo invalido, cancelacion exitosa y cancelacion duplicada.
- Se verifico auditoria de preparacion y cancelacion, junto con la garantia de que venta, pago, caja e items de venta no cambian durante facturacion preparada.

## Validacion

- `pnpm exec vitest run --config vitest.config.ts src/modules/billing/billing.service.spec.ts` desde `backend`
- `pnpm --filter @pharmacy-pos/backend typecheck`
