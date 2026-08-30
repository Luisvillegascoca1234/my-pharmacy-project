# 05 — [UI] TB-02 — Construir gobierno y seguimiento de ejecuciones

**Status:** DONE
**Objective:** UI
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-02 — El superadministrador gobierna ejecuciones y la farmacia conserva snapshots diarios
**Blocked by:** [04 — Persistir configuración global, ejecuciones y snapshots](04-tb-02-backend-persistir-ejecuciones-snapshots.md)

## Outcome

El superadministrador gobierna programación y recálculo desde una interfaz clara, mientras administración consulta estado, vigencia, próxima ejecución e historial sin adquirir facultades globales.

## Acceptance criteria

- [ ] La pantalla muestra último cálculo, estado, vigencia, próxima ejecución e historial.
- [ ] `superadmin` configura frecuencia, día, hora, activación, cobertura, niveles y umbrales.
- [ ] La UI no expone cron ni hiperparámetros estadísticos.
- [ ] "Recalcular ahora" es exclusivo de `superadmin` y se deshabilita durante una ejecución.
- [ ] `admin` dispone de lectura sin controles de gobierno.
- [ ] Un cambio comunica que el resultado vigente está pendiente.
- [ ] Se distinguen ejecuciones exitosas, con advertencias y fallidas.
- [ ] Formulario, carga, errores y conflicto concurrente quedan probados.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_05_ui`.
- Se incorporaron estado, vigencia, proxima ejecucion, historial y gobierno exclusivo de superadministrador, con lectura administrativa y manejo de conflicto concurrente.
- Validaciones reportadas y verificadas: typecheck frontend, 139 pruebas frontend (13 focalizadas), limites arquitectonicos y `git diff --check` aprobados.
- Sin pendientes ni bloqueos. No se ejecuto QA visual.
