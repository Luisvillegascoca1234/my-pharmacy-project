# Ticket 04 - Configure Backend Test Runner And Service Test Utilities

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 01, 02, 03, 05

## Description

Configurar el runner de pruebas backend y las utilidades minimas para probar services de proveedores, compras e inventario sin Express y sin tocar base de datos real por defecto. El backend actualmente no tiene specs ni script de test visible, por lo que este ticket debe crear una base pequena y mantenible antes de escribir cobertura de dominio.

## Scope

- `backend/package.json`
- configuracion de runner backend, preferentemente Vitest si encaja con TypeScript ESM actual
- carpeta de tests backend siguiendo el patron que se defina en este ticket
- factories/fakes compartidos para repositories de `suppliers`, `purchases` e `inventory`
- documentacion corta del comando de pruebas si el repo no tiene convencion previa

## Out Of Scope

- pruebas E2E contra PostgreSQL real
- levantar servicios Docker o dev server
- pruebas frontend
- cambios funcionales en services para acomodar tests salvo pequenas mejoras de inyeccion necesarias
- cobertura exhaustiva de modulos no tocados por este PRD

## Acceptance Criteria

- `pnpm --filter @pharmacy-pos/backend test` o un comando equivalente queda disponible y documentado en `backend/package.json`.
- El runner ejecuta TypeScript ESM sin build previo.
- Las utilidades de test permiten instanciar services con repositories falsos y capturar errores `HttpError`.
- Los tests nuevos pueden ejecutarse sin requerir credenciales de base de datos ni migraciones.
- El setup evita imports directos de Prisma Client en pruebas unitarias de services.
- La configuracion no rompe `pnpm --filter @pharmacy-pos/backend typecheck`.
