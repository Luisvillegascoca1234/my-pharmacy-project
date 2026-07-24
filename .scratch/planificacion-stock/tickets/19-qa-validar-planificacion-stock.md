# 19 — [QA] Validar integralmente Planificación de stock

**Status:** DONE
**Objective:** QA
**Execution owner:** ORCHESTRATOR
**Spec:** [Planificación de stock](../spec.md)
**Tracer bullet:** All tracer bullets
**Blocked by:** [18 — Revisar contratos y descargas Parquet](18-tb-06-code-review-revisar-parquet.md)

## Outcome

El orquestador valida directamente en el navegador integrado los seis tracer bullets y sus estados de error, corrige todos los defectos encontrados y repite los recorridos afectados hasta dejar la funcionalidad completa aprobada.

## Acceptance criteria

- [ ] El orquestador lee las instrucciones raíz antes de actuar y no delega QA a ningún subagente.
- [ ] Se asume que el servidor de desarrollo está levantado y se usa Computer Use mediante el navegador integrado.
- [ ] El entorno es no productivo y dispone de cuentas `superadmin`, `admin` y `seller`.
- [ ] Se prepara el escenario sintético estándar y un lector Parquet.
- [ ] Se ejecuta el journey completo de TB-01, incluido arranque vacío, edición, persistencia y acceso denegado.
- [ ] Se ejecuta TB-02, incluido gobierno, recálculo, conflicto concurrente, desactivación y snapshots.
- [ ] Se ejecuta TB-03 con patrones estable, semanal, intermitente, creciente, sin ventas, censurado y fallo aislado.
- [ ] Se ejecuta TB-04 con criticidades, FEFO, vencimientos, compra en borrador, presentaciones, dashboard y alertas.
- [ ] Se ejecuta TB-05 con las tres gráficas, comparación, producto inactivo y ejecución fallida posterior.
- [ ] Se ejecuta TB-06 con ambas descargas, tipos Parquet, auditoría, límites, CSV y permisos.
- [ ] Se cubren carga, vacío, error recuperable, configuración inconsistente y disposición adaptable.
- [ ] Los defectos se corrigen directamente en backend, frontend, contratos o pruebas según corresponda.
- [ ] Cada journey afectado se repite después de una corrección.
- [ ] La evidencia, correcciones y rechecks quedan registrados en Comments.
- [ ] El ticket permanece TODO hasta que todos los recorridos aplicables pasen.

## Comments

- QA ejecutado directamente por el orquestador, sin subagentes, sobre la base no productiva aislada `pharmacy_pos_qa_planificacion_stock_019f9074` con cuentas `superadmin`, `admin` y `seller`.
- Preparación: escenario sintético estándar determinista de 250 productos × 731 días en `qa-synthetic-standard.json`, matriz farmacéutica navegable para los siete patrones y lector Parquet real con `parquet-wasm`/Apache Arrow.
- TB-01: arranque frío visible como referencia configurada —no pronóstico—, edición y persistencia de criticidad crítica, cobertura de 45 días y presentación; `admin` conserva lectura sin gobierno global y `seller` recibe acceso denegado.
- TB-02: política semanal del jueves a las 02:00, cobertura general de 35 días, recálculo manual versionado, rechazo concurrente con “Ya existe un cálculo en curso”, motor desactivado con snapshots diarios aún activos y dos snapshots `captured`/`reconstructed` verificados.
- TB-03: patrones estable, semanal, intermitente, creciente, sin ventas, censurado y fallo aislado visibles; se verificaron madurez, confianza, modelo, censura de 20 días y conservación del resultado anterior sin ocultar productos vigentes.
- TB-04: dashboard con 9 productos evaluados, 7 reposiciones, 1 crítico y 1 riesgo de vencimiento; criticidades y cuantiles, presentación `Caja QA` de 10 UND, compra en borrador de 40 UND como contexto, alertas administrativas, costos secundarios y lotes FEFO ordenados por vencimiento 02/08 antes de 22/08.
- TB-05: las tres gráficas —demanda/pronóstico con banda central 80%, stock/meta y error/sesgo—, comparación inmediata entre ejecuciones, historial auditable de producto inactivo sin recomendación vigente y fallo posterior del 23/07 a las 22:00 conservando la última evidencia válida.
- TB-06: ambas descargas muestran “Archivo generado”; el lector verificó 756 filas por conjunto, fechas `Date32`, marcas UTC, booleanos, enteros, decimales tipados, metadatos de esquema `1.0.0` y compresión ZSTD. Auditoría `STOCK_PLANNING_FILE_GENERATED` comprobada para ambos archivos. El rango superior a cinco años fue rechazado y recuperado con “Reducir a 90 días”; ventas CSV sin filas y movimientos CSV descargado; `seller` permanece denegado.
- Estados transversales: carga explícita con controles deshabilitados, catálogo vacío filtrado, error recuperable preservando datos y reintento exitoso, validación de cobertura inconsistente (`>= 1`) y disposición adaptable comprobada a 390 × 844 px.
- Defecto corregido durante QA: `pg_advisory_xact_lock` de configuración usaba `$queryRaw` y Prisma intentaba deserializar el retorno `void`, provocando HTTP 500. Se cambió a `$executeRaw` y se actualizó su prueba de repositorio; el journey de guardado se repitió satisfactoriamente.
- Rechecks finales: backend 35 archivos / 264 pruebas, frontend 21 archivos / 165 pruebas, typecheck de los cuatro workspaces y `git diff --check`, todos satisfactorios. Sin pendientes ni bloqueos.
