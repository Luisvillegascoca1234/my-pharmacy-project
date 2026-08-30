# 08 — [UI] TB-03 — Comunicar madurez, modelo y confianza del pronóstico

**Status:** DONE
**Objective:** UI
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-03 — La historia real se convierte en un pronóstico explicable
**Blocked by:** [07 — Implementar demanda temporal, backtesting y pronóstico](07-tb-03-backend-implementar-pronostico-explicable.md)

## Outcome

La pantalla comunica la transición desde referencia hasta predicción operativa y permite comprender demanda, intervalo, modelo, error, sesgo, censura y limitaciones.

## Acceptance criteria

- [ ] La UI muestra Sin historial, Baja confianza, Predicción operativa y Sin demanda observada.
- [ ] Demanda, banda del 80%, modelo, error, sesgo y días censurados tienen unidades claras.
- [ ] Confianza se explica mediante evidencia, desempeño, censura y amplitud.
- [ ] Baseline y degradación se comunican sin lenguaje engañoso.
- [ ] La referencia permanece cuando no existe pronóstico habilitado.
- [ ] Los productos fallidos muestran el último resultado como desactualizado.
- [ ] Existen estados claros para advertencias y falta de evidencia.
- [ ] Mapeos, store, hooks y estados quedan cubiertos por pruebas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_08_ui`.
- Se comunicaron madurez, confianza, banda, modelo, error, sesgo, censura, baseline, degradacion, referencia y ultimo resultado desactualizado.
- Validaciones: typecheck frontend, 148 pruebas frontend, fronteras del modulo portable y `git diff --check` aprobados.
- Sin pendientes ni bloqueos. No se ejecuto QA visual.
