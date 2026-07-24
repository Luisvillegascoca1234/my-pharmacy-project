# 10 — [BACKEND] TB-04 — Calcular reabastecimiento con criticidad, FEFO y vencimientos

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-04 — La predicción se transforma en una recomendación farmacéutica priorizada
**Blocked by:** [09 — Revisar el motor y la experiencia de pronóstico](09-tb-03-code-review-revisar-pronostico.md)

## Outcome

El pronóstico se transforma en una recomendación consultiva que aplica niveles de servicio, stock mínimo, FEFO, vencimientos, presentaciones, costos y alertas, sin modificar compras ni inventario.

## Acceptance criteria

- [ ] La meta usa el máximo entre stock mínimo y cuantil acumulado.
- [ ] Los niveles son 90% normal, 95% alta y 99% crítica.
- [ ] La simulación FEFO separa stock utilizable, riesgo y stock no utilizable.
- [ ] Las compras en borrador son contexto y no reducen la sugerencia.
- [ ] La sugerencia es no negativa y se redondea a la presentación.
- [ ] El costo usa evidencia confiable y se omite cuando no existe.
- [ ] Se publican filtros, agrupación por proveedor y resumen.
- [ ] Las alertas se deduplican con las prioridades acordadas.
- [ ] Las recomendaciones no crean compras, lotes ni movimientos.
- [ ] FEFO, cuantiles, redondeo, alertas y permisos quedan probados.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_10_backend`.
- Se incorporaron cuantiles por criticidad, simulacion FEFO, separacion de stock, sugerencia redondeada, contexto de borradores, costo confiable, filtros, resumen y alertas deduplicadas.
- Validaciones: typechecks backend/frontend/shared, Prisma, 247 pruebas backend (23 focalizadas) y `git diff --check` aprobados.
- Sin pendientes ni bloqueos. No se ejecuto QA manual.
