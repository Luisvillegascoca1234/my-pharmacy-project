# 20 — [DOCS] Documentar Planificación de stock

**Status:** DONE
**Objective:** DOCS
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** All tracer bullets
**Blocked by:** [19 — Validar integralmente Planificación de stock](19-qa-validar-planificacion-stock.md)

## Outcome

La aplicación de documentación explica en español y con terminología farmacéutica únicamente el comportamiento validado por QA, sin describir organización interna ni afirmar capacidades fuera de alcance.

## Acceptance criteria

- [ ] Diferencia referencia configurada, pronóstico y recomendación.
- [ ] Explica madurez, confianza, cobertura, criticidad, protección, error y sesgo.
- [ ] Explica stock mínimo, seguridad, FEFO, lotes, vencimientos, presentaciones y compras en borrador.
- [ ] Explica programación, snapshots, recálculo, vigencia, historial y alertas.
- [ ] Explica las gráficas, comparación y exportaciones Parquet.
- [ ] Declara arranque sin datos, demanda censurada, ausencia de variables externas y límites.
- [ ] Indica que la recomendación no crea compras, no reserva stock ni modifica inventario.
- [ ] Solo documenta comportamiento validado por el ticket QA.
- [ ] No menciona archivos, carpetas, capas, dependencias ni organización del código.

## Comments

- Documentación completada por el subagente dedicado `/root/ticket_20_docs` y corregida por el mismo subagente para integrarla en la aplicación navegable.
- Se publicó la guía administrativa `/docs/planificacion-stock`, enlazada desde “Guías de uso” y referenciada en la portada.
- La guía diferencia referencia configurada, pronóstico y recomendación; explica madurez, confianza, cobertura, criticidad, protección, error, sesgo, stock mínimo, seguridad, FEFO, lotes, vencimientos, presentaciones, compras en borrador, programación, snapshots, vigencia, historial, alertas, gráficas, comparación y Parquet.
- Declara explícitamente el arranque sin datos, la demanda censurada, las variables externas ausentes, los límites analíticos y el carácter exclusivamente consultivo de la recomendación.
- Validaciones: typecheck y build de la aplicación de documentación, generación estática de la ruta, matriz de conceptos obligatorios, navegación, términos prohibidos, espacios finales y `git diff --check`, todas satisfactorias.
- No se mencionan detalles internos de implementación. Sin pendientes ni bloqueos.
