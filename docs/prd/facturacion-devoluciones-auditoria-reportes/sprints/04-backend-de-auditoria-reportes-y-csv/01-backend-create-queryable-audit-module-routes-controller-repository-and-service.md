# Ticket 01 - Create queryable audit module routes controller repository and service

- Status: DONE
- Category: BACKEND
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear el modulo backend `audit` para consultar eventos sensibles ya registrados por flujos administrativos. La auditoria consultable debe quedar limitada a `superadmin`, con paginacion, filtros basicos y metadata completa.

## Scope

- Crear `audit.routes.ts`, `audit.controller.ts`, `audit.service.ts`, `audit.repository.ts` y `audit.types.ts`.
- Registrar `GET /audit/logs` y conectarlo al router principal.
- Proteger la ruta con autenticacion y rol `superadmin`; `admin` y `seller` no deben acceder.
- Validar `AuditLogsQuerySchema` y responder con `AuditLogsListResponseSchema`.
- Soportar filtros por accion, actor, tipo de entidad, entidad y rango de fechas.
- Ordenar eventos por fecha descendente y devolver metadata completa como JSON.
- Incluir resumen del actor cuando exista sin fallar para eventos sin usuario.

## Out Of Scope

- Crear eventos nuevos fuera de descargas CSV.
- Pantalla de auditoria o metadata colapsable en UI.
- Reportes operativos y exportaciones CSV.

## Acceptance Criteria

- `GET /audit/logs` existe y valida query/response con contratos compartidos.
- Solo `superadmin` puede consultar auditoria.
- Los filtros basicos se aplican sobre `AuditLog` sin consultas Prisma fuera del repository.
- La respuesta incluye metadata completa y paginacion consistente.
- La consulta de auditoria no crea nuevos eventos de auditoria.
