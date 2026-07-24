# 01 — [BACKEND] TB-01 — Publicar configuración y referencias de arranque en frío

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-01 — Administración prepara productos y consulta referencias de arranque en frío
**Blocked by:** None — start here

## Outcome

El servidor publica la configuración farmacéutica por producto y una referencia explicable para productos sin historia, con contratos compartidos, permisos administrativos, auditoría y pruebas automatizadas, sin construir la UI.

## Acceptance criteria

- [ ] Cada producto exige criticidad y admite cobertura específica y presentación preferida opcionales.
- [ ] La cobertura ausente hereda el valor global inicial de 30 días.
- [ ] El stock utilizable excluye lotes vencidos o bloqueados.
- [ ] La referencia es no negativa, usa stock mínimo y se redondea a la presentación preferida cuando existe.
- [ ] La respuesta diferencia referencia configurada, madurez sin historial y advertencias.
- [ ] `admin` y `superadmin` pueden consultar y configurar; `seller` recibe denegación.
- [ ] Los cambios por producto generan auditoría sin movimientos de inventario.
- [ ] Los contratos y reglas quedan cubiertos por pruebas automatizadas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_01_backend`.
- Se incorporaron configuracion global y por producto, referencia de arranque en frio, permisos administrativos, auditoria y contratos compartidos.
- Validaciones reportadas y verificadas: Prisma Client y schema correctos, typecheck del workspace correcto, 201 pruebas backend aprobadas (11 especificas de planificacion de stock) y `git diff --check` sin errores.
- Sin pendientes ni bloqueos. No se ejecuto QA visual.
