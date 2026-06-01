# Ticket 09 - Run Validation Guardrails On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 08
- Blocks: none

## Description

Ejecutar validaciones tecnicas sobre el backend de ventas POS y FEFO para confirmar que contratos, reglas, API, pruebas y OpenAPI quedaron consistentes. Este ticket no requiere verificacion manual de producto ni navegador.

## Scope

- typecheck de paquetes tocados
- pruebas automatizadas backend relacionadas con ventas, caja e inventario cercano
- validacion de contratos compartidos
- validacion de OpenAPI si el repo cuenta con guardrail disponible
- revision de errores de importacion, exports o enrutamiento causados por ventas POS

## Out Of Scope

- verificacion manual de UI o navegador
- iniciar o detener dev servers
- probar pantallas POS
- validar anulacion de ventas o carritos pendientes
- cerrar el epic como `DONE`

## Acceptance Criteria

- Los comandos de validacion tecnica relevantes se ejecutan o se documenta claramente por que no pudieron ejecutarse.
- Las pruebas automatizadas de ventas/POS/FEFO pasan.
- El typecheck no presenta errores atribuibles al sprint.
- Los contratos compartidos siguen compilando.
- La documentacion OpenAPI no rompe la generacion o typecheck disponible.
- Cualquier bloqueo externo queda documentado con comando y salida relevante.

## Validation Record

- `pnpm --filter @pharmacy-pos/shared typecheck` paso sin errores, validando contratos compartidos.
- `pnpm --filter @pharmacy-pos/backend typecheck` paso sin errores para backend y OpenAPI disponible.
- `pnpm --filter @pharmacy-pos/backend test` paso: 8 archivos de prueba y 47 pruebas exitosas, incluyendo ventas, POS, caja e inventario cercano.
- `pnpm --dir backend exec prisma validate --schema prisma/schema.prisma` paso con `DATABASE_URL` local de desarrollo.
- `pnpm --filter @pharmacy-pos/backend prisma:generate` regenero el cliente Prisma sin errores.
- `pnpm --dir backend exec prisma migrate status --schema prisma/schema.prisma` termino con la base local actualizada.
- El primer `prisma validate` sin `DATABASE_URL` fallo por configuracion de entorno; se volvio a ejecutar con la URL local documentada y paso.
- Se corrigio una deriva local de migraciones: `20260531120000_add_cash_sales_pos_persistence` hacia fallar Prisma por falta de `migration.sql`, y el SQL versionado equivalente quedo alineado con el nombre ya registrado en la base local.
- La base local ya tenia aplicada manualmente la estructura de ventas antes de registrar `20260601120000_add_sales_fefo_allocation`; se resolvio ese registro local como aplicado y se ejecuto la migracion pendiente `20260601130000_rename_sale_inventory_movement_type`.
- `pnpm --dir backend exec prisma migrate diff --from-migrations prisma/migrations --to-url $env:DATABASE_URL --shadow-database-url $env:SHADOW_DATABASE_URL --exit-code --script` reporto diferencias locales asociadas a carritos pendientes, anulacion y reversa de pagos; se consideran fuera del alcance de este sprint de venta confirmada POS/FEFO.
- No se encontro un guardrail OpenAPI separado; la definicion disponible queda cubierta por el typecheck del backend.
