# 16 — [BACKEND] TB-06 — Generar y auditar exportaciones Parquet versionadas

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** TB-06 — Administración descarga series y resultados en Parquet auditable
**Blocked by:** [15 — Revisar análisis temporal e historial](15-tb-05-code-review-revisar-analisis-historial.md)

## Outcome

El servidor genera bajo demanda Parquet tipado para series y predicciones, con esquema versionado, filtros, límites, compresión, transmisión binaria, permisos y auditoría.

## Acceptance criteria

- [ ] Existen exportaciones independientes de serie temporal y resultados predictivos.
- [ ] El rango obligatorio no supera cinco años y admite los filtros acordados.
- [ ] La exportación predictiva selecciona una ejecución.
- [ ] Se rechazan más de 1.000.000 de filas antes de generar.
- [ ] Identificadores, fechas, timestamps, decimales, booleanos y nulos conservan tipos.
- [ ] Los archivos declaran versión y Zstandard.
- [ ] La transmisión no conserva artefactos permanentes.
- [ ] La auditoría registra "archivo generado" con metadatos suficientes.
- [ ] `admin` y `superadmin` exportan; `seller` recibe denegación.
- [ ] Escritura, lectura de vuelta, límites, filtros y auditoría quedan probados.

## Comments

- Implementacion completada por el subagente dedicado `/root/ticket_16_backend`.
- Se incorporaron dos exportaciones Parquet tipadas, rango/filtros/limite, seleccion de ejecucion, esquema 1.0.0, Zstandard, transmision en memoria, permisos y auditoria de archivo generado.
- Validaciones: 264 pruebas backend (7 Parquet con roundtrip), typecheck completo, limites/filtros/auditoria y `git diff --check`; no quedaron artefactos Parquet permanentes.
- Sin pendientes ni bloqueos. No se ejecuto QA.
