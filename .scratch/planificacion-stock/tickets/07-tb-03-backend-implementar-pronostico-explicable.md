# 07 — [BACKEND] TB-03 — Implementar demanda temporal, backtesting y pronóstico explicable

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-03 — La historia real se convierte en un pronóstico explicable
**Blocked by:** [06 — Revisar ejecuciones, programación y snapshots](06-tb-02-code-review-revisar-ejecuciones-snapshots.md)

## Outcome

La historia operacional se transforma en pronósticos diarios reproducibles mediante modelos explicables y backtesting; el sistema clasifica madurez y confianza, aísla fallos y ofrece escenarios sintéticos para desarrollo.

## Acceptance criteria

- [ ] La demanda diaria usa ventas confirmadas netas de anulaciones y devoluciones en unidad base.
- [ ] Los días disponibles sin ventas son cero; los días completos sin stock quedan censurados.
- [ ] Se usan como máximo 24 meses y se conservan picos válidos.
- [ ] Los candidatos acordados compiten mediante backtesting sin fuga temporal.
- [ ] El baseline permanece cuando nadie lo mejora y el modelo simple gana ante empate.
- [ ] Madurez, confianza, intervalos, métricas, sesgo, parámetros, huella y versión quedan persistidos.
- [ ] Demanda y límites publicados nunca son negativos.
- [ ] Los fallos por producto no ocultan resultados válidos.
- [ ] El generador implementa perfiles, semilla, bloqueo productivo, escenario estándar y verdad conocida sin crear predicciones.
- [ ] Motor, modelos intermitentes, generador e invariantes quedan cubiertos por pruebas deterministas.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_07_backend`.
- Se incorporaron demanda neta y censura, backtesting sin fuga, modelos explicables, madurez/confianza, persistencia inmutable, fallos parciales y generador sintetico determinista bloqueado en produccion.
- Validaciones: 237 pruebas backend, 140 frontend de regresion, typechecks, Prisma, 18 migraciones limpias e integracion real con pronostico persistido.
- Sin pendientes ni bloqueos. No se ejecuto QA visual.
