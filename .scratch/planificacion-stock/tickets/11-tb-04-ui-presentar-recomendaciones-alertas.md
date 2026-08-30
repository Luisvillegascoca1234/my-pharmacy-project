# 11 — [UI] TB-04 — Presentar recomendaciones, prioridades y alertas administrativas

**Status:** DONE
**Objective:** UI
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-04 — La predicción se transforma en una recomendación farmacéutica priorizada
**Blocked by:** [10 — Calcular reabastecimiento con criticidad, FEFO y vencimientos](10-tb-04-backend-calcular-reabastecimiento-fefo.md)

## Outcome

Administración dispone de una tabla priorizada, filtros, agrupación por proveedor, dashboard y alertas que explican cuánto reabastecer y por qué.

## Acceptance criteria

- [ ] La tabla muestra demanda, seguridad, meta, sugerencia, presentación, costo, cobertura, confianza y riesgos.
- [ ] La prioridad inicial destaca agotamiento crítico, urgencia y vencimiento.
- [ ] Se filtra por producto, categoría, proveedor, criticidad, madurez, confianza y riesgo.
- [ ] La agrupación por proveedor no sugiere que modifica el pronóstico.
- [ ] Las compras en borrador se muestran sin descontarse.
- [ ] El dashboard muestra cuatro conteos y estado del cálculo.
- [ ] Las alertas predictivas son solo administrativas.
- [ ] La UI comunica costo, presentación o cálculo desactualizado.
- [ ] Filtros, resumen, alertas y estados quedan probados.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_11_ui`.
- Se incorporaron tabla priorizada, filtros, agrupacion aclaratoria, borradores como contexto, dashboard, alertas administrativas y estados de costo, presentacion y vigencia.
- Validaciones: typecheck frontend, 153 pruebas frontend, barrido limpio de TODO/FIXME/console y `git diff --check`.
- Sin pendientes ni bloqueos. No se ejecuto QA manual.
