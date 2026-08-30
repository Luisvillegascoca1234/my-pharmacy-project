# 13 — [BACKEND] TB-05 — Publicar detalle temporal y comparación de ejecuciones

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-05 — Administración analiza evolución, desempeño e historial por producto
**Blocked by:** [12 — Revisar recomendaciones, FEFO y priorización](12-tb-04-code-review-revisar-recomendaciones.md)

## Outcome

El servidor publica una lectura histórica reproducible por producto con demanda, pronóstico, stock, meta, lotes, desempeño y comparación contra la ejecución anterior.

## Acceptance criteria

- [ ] El detalle incluye observaciones, pronóstico, banda, snapshots, meta y lotes.
- [ ] Se exponen fórmula, modelo, madurez, confianza, error, sesgo y censura.
- [ ] Una ejecución se compara con su anterior inmediata.
- [ ] Se resuelve la última exitosa aunque exista una posterior fallida.
- [ ] Los productos inactivos conservan historia y dejan de recibir recomendaciones.
- [ ] Fechas operativas usan `America/La_Paz` y timestamps usan UTC.
- [ ] La retención respeta snapshots y resultados acordados.
- [ ] Detalle, comparación e historial quedan cubiertos por pruebas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_13_backend`.
- Se publico detalle historico, comparacion inmediata, ultima exitosa con fallos posteriores, historia de inactivos, fechas operativas/timestamps y politica de retencion.
- Validaciones: typechecks shared/backend, 64 pruebas del modulo de planificacion y `git diff --check`.
- Sin pendientes ni bloqueos. No se ejecuto QA.
