# Ticket 03 - Generate Migration And Prisma Client Guardrails

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 02
- Blocks: 04

## Description

Generar y validar la migracion Prisma que materializa el schema de este sprint, incluyendo los guardrails necesarios para restricciones que Prisma no expresa directamente con el nivel de precision requerido. La salida debe dejar el cliente Prisma regenerado y una ruta clara para que los siguientes tickets backend consuman los modelos nuevos.

## Scope

- `backend/prisma/migrations`
- generacion de Prisma Client para los modelos nuevos
- validacion de restricciones, indices y relaciones creadas por la migracion
- documentacion breve de cualquier SQL manual necesario para unicidad parcial de `Supplier.nit`
- comandos de verificacion relacionados con Prisma y TypeScript del scope tocado

## Out Of Scope

- seed funcional de proveedores o compras
- implementacion de endpoints, services, repositories o pruebas de dominio
- datos demo para UI
- cambios de Docker, dev server o configuracion de despliegue

## Acceptance Criteria

- La migracion se crea con un nombre descriptivo del sprint y no mezcla cambios ajenos a proveedores/compras/inventario.
- `pnpm --filter @pharmacy-pos/backend prisma:generate` se ejecuta correctamente.
- La estrategia para NIT opcional unico queda aplicada en la migracion o documentada como SQL manual dentro de la propia migracion.
- `backend/prisma/schema.prisma` y la migracion reflejan los mismos enums, modelos, relaciones e indices esperados.
- El scope tocado pasa typecheck o, si el typecheck global falla por deuda previa, se documenta la falla exacta y por que no pertenece al sprint.
- No se generan archivos de migracion duplicados, vacios o con operaciones destructivas innecesarias sobre tablas existentes.
