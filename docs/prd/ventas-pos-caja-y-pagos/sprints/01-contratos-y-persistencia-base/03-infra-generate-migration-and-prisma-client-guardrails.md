# Ticket 03 - Generate Migration And Prisma Client Guardrails

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 02
- Blocks: 04

## Description

Generar la migracion y actualizar el cliente Prisma despues de definir la persistencia base. El objetivo es dejar guardrails claros para que los sprints de caja y ventas trabajen sobre una base aplicada, versionada y verificable.

## Scope

- Migracion de base de datos para los modelos y enums del sprint.
- Regeneracion del cliente Prisma.
- Verificacion de que los contratos compartidos compilan con los nuevos exports.
- Notas breves de aplicacion de migracion cuando exista una restriccion que Prisma no pueda expresar directamente.
- Revision de indices, relaciones y restricciones criticas antes de cerrar el sprint.

## Out Of Scope

- Crear datos de seed obligatorios para ventas POS.
- Implementar API ejecutable, reglas transaccionales o pantallas.
- Ejecutar flujos reales de caja o venta.
- Resolver reportes, SIAT, QR, tarjeta o credito.

## Acceptance Criteria

- Existe una migracion versionada para caja, ventas, pagos, consumos por lote y carritos pendientes.
- El cliente Prisma se regenera sin errores.
- Las restricciones especiales necesarias para una sola caja abierta por usuario quedan aplicadas o documentadas con una estrategia PostgreSQL compatible.
- Los enums de movimientos de inventario quedan preparados para salidas de venta y reversas de anulacion.
- Los exports compartidos compilan sin romper consumidores existentes.
- Los comandos de generacion y verificacion usados quedan anotados en el ticket o en la evidencia de cierre del sprint.

## Evidencia de cierre

- Migracion versionada registrada para caja, ventas, pagos, consumos por lote y carritos pendientes.
- Guardrail PostgreSQL aplicado mediante indice unico parcial para impedir mas de una caja abierta por usuario.
- Enums de movimiento de inventario preparados para salida de venta y reversa de anulacion.
- Cliente Prisma regenerado con `pnpm --filter @pharmacy-pos/backend prisma:generate`.
- Migraciones pendientes aplicadas con `pnpm --filter @pharmacy-pos/backend exec prisma migrate deploy --schema prisma/schema.prisma` usando `DATABASE_URL` PostgreSQL local.
- Contratos compartidos verificados con `pnpm --filter @pharmacy-pos/shared typecheck`.
- Esquema Prisma validado con `pnpm --filter @pharmacy-pos/backend exec prisma validate --schema prisma/schema.prisma` usando `DATABASE_URL` PostgreSQL local para la validacion sintactica.
