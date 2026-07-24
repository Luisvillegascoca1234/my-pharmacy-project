# 04 — [BACKEND] TB-02 — Persistir configuración global, ejecuciones y snapshots diarios

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-02 — El superadministrador gobierna ejecuciones y la farmacia conserva snapshots diarios
**Blocked by:** [03 — Revisar el arranque en frío](03-tb-01-code-review-revisar-arranque-frio.md)

## Outcome

El sistema conserva configuración global versionada, ejecuciones inmutables y snapshots diarios por producto y lote, con programación local, bloqueo concurrente, recuperación, auditoría y contratos consumibles.

## Acceptance criteria

- [ ] La configuración admite activación, frecuencia diaria o semanal, día, hora, cobertura, niveles y umbrales.
- [ ] El valor inicial ejecuta diariamente a las 02:00 en `America/La_Paz`.
- [ ] Cada ejecución congela configuración, disparador, cortes, versión y estado.
- [ ] El bloqueo PostgreSQL y la idempotencia impiden ejecuciones equivalentes simultáneas.
- [ ] Solo `superadmin` cambia configuración global o recalcula; `admin` puede consultar.
- [ ] Los snapshots diarios continúan cuando el motor está desactivado.
- [ ] Los snapshots conservan detalle por lote y distinguen captura de reconstrucción.
- [ ] El arranque recupera una única ejecución omitida.
- [ ] Cambios globales y recálculos manuales generan auditoría.
- [ ] Programación, persistencia, permisos y reloj quedan cubiertos por pruebas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_04_backend`.
- Se incorporaron configuracion global versionada, ejecuciones inmutables, bloqueo e idempotencia PostgreSQL, snapshots diarios, recuperacion, scheduler, permisos, auditoria y contratos.
- Validaciones: typecheck completo, 217 pruebas backend (58 focalizadas), `git diff --check` y 17 migraciones aplicadas desde cero en PostgreSQL temporal.
- La base de desarrollo compartida contenia tablas experimentales incompatibles ajenas a esta cadena; no se eliminaron ni sobrescribieron datos. La migracion queda comprobada en base limpia.
- Sin pendientes funcionales ni bloqueos. No se ejecuto QA.
