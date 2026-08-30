# 17 — [UI] TB-06 — Integrar descargas Parquet analíticas

**Status:** DONE
**Objective:** UI
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-06 — Administración descarga series y resultados en Parquet auditable
**Blocked by:** [16 — Generar y auditar exportaciones Parquet](16-tb-06-backend-generar-parquet.md)

## Outcome

Administrador y superadministrador descargan series y predicciones desde Planificación de stock y Exportaciones, con filtros, validaciones y manejo binario, sin afectar CSV.

## Acceptance criteria

- [ ] Ambas descargas están disponibles desde las dos superficies acordadas.
- [ ] La UI solicita rango y filtros aplicables.
- [ ] Se diferencia entre observaciones y resultados calculados.
- [ ] El cliente procesa binario y usa nombres descriptivos.
- [ ] Los límites se comunican con una acción para reducir filtros.
- [ ] Los errores se recuperan sin afectar la otra descarga.
- [ ] Los CSV permanecen disponibles.
- [ ] `seller` no puede acceder.
- [ ] Transporte, facade, store, filtros y estados quedan probados.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_17_ui`.
- Se integraron ambas descargas en Planificacion de stock y Exportaciones, con filtros, ejecucion, binario, nombres, limites recuperables, errores independientes, CSV preservado y permisos.
- Validaciones: 165 pruebas frontend, typecheck, build de produccion, limites arquitectonicos y `git diff --check`.
- Sin pendientes ni bloqueos. No se ejecuto QA.
