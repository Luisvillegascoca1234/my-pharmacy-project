# Planificación de stock

## Problem Statement

La farmacia necesita decidir cuánto inventario reabastecer sin depender únicamente de una cifra estática de stock mínimo. El inventario se controla por producto, unidad base, lote y vencimiento; las salidas siguen FEFO y las anulaciones, devoluciones y ajustes tienen efectos distintos. Una recomendación útil debe reconocer esas reglas, estimar demanda futura, expresar incertidumbre y evitar considerar como disponible el stock que probablemente vencerá antes de consumirse.

La base de producción comenzará vacía. Durante las primeras semanas no existirá evidencia suficiente para producir pronósticos responsables. El sistema debe acompañar ese arranque en frío sin presentar una referencia configurada como si fuera una predicción, y debe evolucionar automáticamente hacia resultados de baja confianza y luego hacia predicciones operativas conforme se acumule historia real.

Actualmente no se conservan snapshots históricos de stock, ejecuciones predictivas, modelos estadísticos, tareas programadas ni exportaciones Parquet. Sí existe la trazabilidad transaccional necesaria: ventas confirmadas, anulaciones, devoluciones, movimientos de inventario, compras recibidas, lotes, vencimientos y cantidades normalizadas a unidad base.

Administración necesita consultar recomendaciones explicables, visualizar la evolución temporal, revisar el desempeño del modelo y descargar datos analíticos tipados. El resultado será exclusivamente consultivo: no creará compras, no modificará inventario y no utilizará tiempos de entrega de proveedores.

## Solution

La aplicación incorporará una superficie administrativa denominada **Planificación de stock**. Para cada producto activo mostrará madurez analítica, demanda prevista, stock utilizable, cobertura, stock de seguridad, meta de inventario, cantidad sugerida, presentación de reabastecimiento, confianza y riesgos de agotamiento o vencimiento.

Mientras un producto no tenga historia suficiente, la aplicación mostrará una referencia configurada calculada como la diferencia no negativa entre stock mínimo y stock utilizable, redondeada a la presentación preferida. Esa cifra se identificará expresamente como referencia y no como pronóstico.

Cuando exista historia suficiente, un motor estadístico explicable evaluará modelos simples, estacionales, de tendencia e intermitencia mediante backtesting cronológico. El modelo ganador producirá una trayectoria diaria, una banda predictiva y una distribución acumulada para la cobertura configurada. La recomendación usará el cuantil correspondiente a la criticidad del producto, aplicará stock mínimo como piso, descontará stock utilizable mediante una proyección FEFO y redondeará la cantidad a una presentación de compra completa.

El cálculo se ejecutará inicialmente todos los días a las 02:00 en `America/La_Paz`. El superadministrador podrá configurar la periodicidad, desactivar el motor y solicitar un recálculo manual. Los snapshots diarios de inventario continuarán aun cuando el motor predictivo esté desactivado. Cada ejecución será versionada, reproducible, auditable e inmutable.

La experiencia incluirá un resumen administrativo en el dashboard, una tabla principal, detalle temporal por producto, comparación de ejecuciones y alertas derivadas del resultado más reciente. Administrador y superadministrador podrán consultar y exportar; solo el superadministrador podrá ejecutar cálculos manuales y modificar parámetros globales.

Las exportaciones Parquet se generarán bajo demanda y sin almacenamiento permanente. Habrá un conjunto de serie temporal analítica y otro de resultados predictivos. Un generador sintético determinista, bloqueado en producción, producirá escenarios farmacéuticos plausibles para desarrollo y evaluación con una verdad conocida, sin contaminar ni entrenar recomendaciones productivas.

## User Stories

1. Como administrador, quiero conocer cuánto inventario conviene reabastecer por producto para planificar el abastecimiento.
2. Como administrador, quiero distinguir una referencia configurada de una predicción estadística para no atribuir confianza inexistente a productos nuevos.
3. Como administrador, quiero conocer la cobertura estimada en días para priorizar productos con riesgo de agotamiento.
4. Como administrador, quiero ver la recomendación en unidad base y presentación preferida para convertirla en una decisión operativa.
5. Como administrador, quiero que el stock mínimo actúe como piso para conservar la política operativa configurada.
6. Como administrador, quiero que lotes vencidos, bloqueados o con riesgo de vencer no inflen el stock utilizable.
7. Como administrador, quiero que la proyección respete FEFO para comprender qué lotes podrían consumirse antes de vencer.
8. Como administrador, quiero que las compras en borrador se muestren como información sin reducir la recomendación.
9. Como administrador, quiero clasificar cada producto como crítico, alto o normal para ajustar la protección frente a faltantes.
10. Como administrador, quiero configurar una cobertura específica cuando un producto necesite apartarse de los 30 días globales.
11. Como administrador, quiero filtrar recomendaciones por producto, categoría, proveedor, criticidad, madurez, confianza y riesgo.
12. Como administrador, quiero agrupar recomendaciones por proveedor sin convertirlo en una variable del pronóstico.
13. Como administrador, quiero consultar el último costo conocido como estimación secundaria del reabastecimiento.
14. Como administrador, quiero conocer el modelo elegido y su desempeño para comprender la confianza del pronóstico.
15. Como administrador, quiero ver demanda real frente a pronosticada para interpretar tendencias, intermitencia y desviaciones.
16. Como administrador, quiero ver la evolución del stock frente a la meta para analizar cobertura y reposición.
17. Como administrador, quiero revisar error y sesgo históricos para detectar degradación.
18. Como administrador, quiero comparar una ejecución con la anterior para identificar cambios relevantes.
19. Como administrador, quiero recibir alertas de reabastecimiento, agotamiento crítico, vencimiento y cálculo desactualizado.
20. Como administrador, quiero descargar series temporales y resultados predictivos en Parquet para analizarlos externamente.
21. Como administrador, quiero que las exportaciones incluyan productos con historia insuficiente para analizar todo el catálogo.
22. Como superadministrador, quiero configurar cobertura global, niveles de servicio, umbrales de madurez y horario.
23. Como superadministrador, quiero activar o desactivar el motor sin perder snapshots ni resultados históricos.
24. Como superadministrador, quiero recalcular manualmente sin permitir ejecuciones simultáneas.
25. Como superadministrador, quiero revisar ejecuciones exitosas, fallidas o con advertencias.
26. Como responsable de inventario, quiero que la demanda use ventas confirmadas netas de anulaciones y devoluciones.
27. Como responsable de inventario, quiero que los días completos sin stock se identifiquen como censurados.
28. Como responsable de inventario, quiero conservar snapshots diarios aunque el pronóstico sea semanal o esté desactivado.
29. Como auditor, quiero que cambios de configuración, recálculos y archivos Parquet generados queden auditados.
30. Como auditor, quiero que ejecuciones y recomendaciones históricas permanezcan inmutables.
31. Como usuario administrativo, quiero que un fallo de un producto no oculte los resultados válidos de los demás.
32. Como usuario administrativo, quiero conservar el último resultado exitoso cuando una ejecución posterior falle.
33. Como desarrollador, quiero escenarios sintéticos deterministas con verdad conocida para evaluar modelos antes de tener historia productiva.
34. Como desarrollador, quiero que el generador sintético se niegue a operar en producción.
35. Como desarrollador, quiero contratos compartidos y esquemas Parquet versionados para mantener las superficies alineadas.

## Tracer Bullets

### TB-01 — Administración prepara productos y consulta referencias de arranque en frío

**User outcome:** Administrador y superadministrador abren Planificación de stock desde una producción sin historia y encuentran cada producto activo clasificado como "Sin historial", con una referencia configurada explicable en lugar de una predicción ficticia.

**Backend responsibility:** Incorporar criticidad obligatoria, cobertura específica opcional y presentación preferida opcional por producto; publicar la configuración global inicial de 30 días; calcular stock utilizable actual sin lotes vencidos o bloqueados; producir la referencia `máximo(0, stock mínimo - stock utilizable)` y redondearla cuando exista presentación preferida; exponer contratos compartidos para configuración, listado, filtros, madurez, referencia y advertencias; permitir consulta a `admin` y `superadmin` y denegar a `seller`. Los cambios por producto deben ser auditables y no deben modificar inventario.

**UI behavior:** Agregar la ruta administrativa Planificación de stock con estado vacío para catálogo sin productos y tabla para productos activos. Mostrar producto, criticidad, stock utilizable, stock mínimo, cobertura heredada o específica, referencia, presentación y advertencias. Diferenciar "Referencia configurada" de "Pronóstico de demanda". Permitir a `admin` y `superadmin` editar criticidad, cobertura específica y presentación preferida. Ocultar navegación y denegar acceso directo a `seller`.

**QA journey:** Con una cuenta administrativa y una base sin historia, crear o seleccionar productos con distintas cantidades, stock mínimo y presentaciones. Abrir Planificación de stock y comprobar "Sin historial", referencia no negativa, redondeo y advertencia por presentación ausente. Cambiar criticidad y cobertura, recargar y comprobar persistencia. Intentar la ruta directa como Vendedor y observar acceso denegado.

**Acceptance criteria:**

- Un producto sin historia nunca se presenta como predicción estadística.
- La referencia es cero cuando el stock utilizable alcanza o supera el stock mínimo.
- Los lotes vencidos o bloqueados no forman parte del stock utilizable.
- La cantidad se redondea hacia arriba a un múltiplo completo cuando existe presentación preferida.
- La cobertura específica ausente hereda los 30 días globales.
- `admin` y `superadmin` pueden consultar y configurar parámetros por producto.
- `seller` no puede consultar la superficie ni sus endpoints.
- Cambiar parámetros genera auditoría sin movimientos de inventario.

### TB-02 — El superadministrador gobierna ejecuciones y la farmacia conserva snapshots diarios

**User outcome:** El superadministrador consulta el estado del motor, configura su periodicidad, solicita un recálculo y observa una ejecución versionada; la farmacia conserva una serie diaria de inventario aun cuando el pronóstico esté desactivado.

**Backend responsibility:** Persistir configuración global versionada, ejecuciones inmutables y snapshots diarios por producto y lote. Admitir frecuencia diaria o semanal, día aplicable, hora local, activación, cobertura global, niveles de servicio y umbrales de madurez mediante valores de negocio. Ejecutar con demanda hasta el último día completo y snapshot de stock al comienzo. Proteger concurrencia con bloqueo PostgreSQL e idempotencia. Mantener la captura diaria independiente del interruptor predictivo; reconstruir snapshots omitidos cuando sea posible, marcándolos como reconstruidos. Permitir recálculo y configuración global solo a `superadmin`; permitir lectura a `admin`.

**UI behavior:** Presentar último cálculo, próxima ejecución, vigencia e historial. Ofrecer al superadministrador controles amigables de frecuencia, día, hora, activación, cobertura, niveles y umbrales, además de "Recalcular ahora". Deshabilitar la acción durante una ejecución activa. Administrador puede leer, pero no gobernar. Una configuración modificada marca el resultado vigente como pendiente.

**QA journey:** Como Superadministrador, cambiar frecuencia y hora, guardar y solicitar un recálculo. Comprobar estado en curso y resultado; intentar otro recálculo simultáneo y observar el bloqueo. Desactivar el motor y comprobar que el snapshot diario continúa. Como Administrador, confirmar que la superficie es de solo lectura.

**Acceptance criteria:**

- El valor inicial es diario a las 02:00 en `America/La_Paz`.
- Solo `superadmin` modifica configuración global o inicia recálculo manual.
- Una ejecución congela la configuración utilizada al comenzar.
- Dos ejecuciones equivalentes no se procesan simultáneamente.
- Desactivar el motor no elimina resultados ni interrumpe snapshots.
- Un snapshot reconstruido se distingue de uno capturado normalmente.
- Cambios globales y recálculos manuales generan auditoría.
- Un resultado se marca desactualizado después de la siguiente ejecución esperada más seis horas o por cambio relevante.

### TB-03 — La historia real se convierte en un pronóstico explicable

**User outcome:** Cuando un producto acumula evidencia suficiente, administración observa trayectoria diaria, banda predictiva, modelo ganador, madurez y confianza, sin perder la explicación de sus limitaciones.

**Backend responsibility:** Construir demanda diaria en unidad base usando ventas confirmadas, excluyendo anulaciones y restando devoluciones que reingresaron; limitar a cero días netos negativos y conservar devoluciones separadas. Completar días sin ventas con cero e identificar días completos sin disponibilidad como censurados. Usar hasta 24 meses y conservar picos válidos. Evaluar mediante backtesting de origen móvil los modelos ingenuo reciente, ingenuo estacional semanal, promedio móvil, suavizado exponencial simple, Holt, Croston-SBA y TSB. Mantener el baseline cuando ningún candidato lo supera. Exigir dos años completos para estacionalidad anual. Persistir puntos diarios, banda central del 80%, modelo, parámetros, métricas, sesgo, huella y versión. Clasificar madurez y confianza con reglas versionadas. Aislar fallos por producto.

**UI behavior:** Sustituir progresivamente la referencia por "Baja confianza" o "Predicción operativa". Mostrar demanda prevista, banda del 80%, modelo, error, sesgo, días censurados, confianza y advertencias. Explicar que confianza baja, media o alta combina historia, backtesting, censura y amplitud, y no es probabilidad de acierto.

**QA journey:** Con un escenario sintético no productivo, abrir productos con demanda estable, semanal, intermitente, creciente, sin ventas y con quiebres. Comprobar madurez, modelo, confianza y advertencias. Verificar que no exista demanda negativa y que la censura reduzca confianza. Provocar un fallo controlado de un producto y confirmar que los demás resultados se publican.

**Acceptance criteria:**

- Menos de 12 semanas o menos de 4 días con demanda produce "Sin historial".
- Con 12 semanas y entre 4 y 11 días con demanda se produce "Baja confianza".
- Con 12 semanas y al menos 12 días se habilita "Predicción operativa", salvo degradación por calidad.
- Tras 12 semanas sin ventas se muestra "Sin demanda observada" y recomendación cero, con advertencias aplicables.
- Los días completos sin stock no se interpretan como demanda cero.
- El modelo ganador surge de backtesting y conserva baseline si ningún candidato lo mejora.
- Demanda e intervalos visibles nunca son negativos.
- Cada resultado conserva información suficiente para reproducirlo.
- Una corrección histórica afecta ejecuciones futuras, pero no reescribe las anteriores.
- Un fallo aislado produce "Con advertencias" sin ocultar productos válidos.

### TB-04 — La predicción se transforma en una recomendación farmacéutica priorizada

**User outcome:** Administración recibe una cantidad sugerida por producto que equilibra disponibilidad, stock mínimo, incertidumbre y vencimiento, con alertas y prioridades accionables.

**Backend responsibility:** Calcular la meta como máximo entre stock mínimo y cuantil acumulado de demanda. Aplicar 90% a criticidad normal, 95% a alta y 99% a crítica. Proyectar consumo diario por FEFO para separar stock utilizable, riesgo de vencimiento y stock vencido o bloqueado. Calcular `máximo(0, meta - stock utilizable)` y redondear a la presentación preferida. Excluir compras en borrador del descuento. Calcular costo estimado con el último costo confiable. Derivar alertas por reabastecimiento, agotamiento crítico, vencimiento y cálculo desactualizado. Publicar resumen y filtros administrativos.

**UI behavior:** Completar la tabla con demanda, stock de seguridad, meta, sugerencia, presentación, costo estimado, cobertura, compras en borrador, confianza y riesgos. Ordenar por urgencia y permitir filtros y agrupación por proveedor. Mostrar en dashboard productos que requieren reabastecimiento, productos críticos con riesgo, productos con riesgo de vencimiento y estado del último cálculo. Integrar alertas administrativas sin mostrarlas a `seller`.

**QA journey:** Preparar productos normales, altos y críticos; lotes con distintos vencimientos; una compra en borrador y presentaciones diferentes. Ejecutar el cálculo y comprobar cuantiles, FEFO, redondeo, costo y advertencias. Confirmar que la compra en borrador no reduce la sugerencia. Revisar dashboard y alertas como Administrador y su ausencia como Vendedor.

**Acceptance criteria:**

- La meta nunca queda por debajo del stock mínimo.
- La criticidad modifica protección sin alterar demanda observada.
- El stock que probablemente no se consuma antes de vencer no infla cobertura útil.
- Una compra en borrador no reduce la cantidad sugerida.
- La sugerencia nunca es negativa y respeta la presentación preferida.
- La ausencia de presentación muestra unidad base y advertencia.
- El costo se identifica como estimación y se omite sin evidencia confiable.
- El dashboard no suma unidades incompatibles.
- Las alertas se deduplican por producto, tipo y ejecución.
- Solo `admin` y `superadmin` ven recomendaciones y alertas predictivas.

### TB-05 — Administración analiza evolución, desempeño e historial por producto

**User outcome:** Administrador y superadministrador abren el detalle de un producto, comprenden la evolución temporal y comparan el resultado vigente con la ejecución anterior.

**Backend responsibility:** Publicar detalle acotado con demanda observada y pronosticada, banda, snapshots, meta, lotes, componentes, backtesting, error, sesgo e historial. Permitir seleccionar una ejecución inmutable y compararla con la anterior. Excluir nuevas recomendaciones para productos inactivos sin eliminar historia. Conservar movimientos y snapshots; mantener al menos 24 meses de predicciones y métricas.

**UI behavior:** Presentar tres gráficas: demanda real frente a pronosticada con banda del 80%, stock frente a meta y error/sesgo histórico. Mostrar lotes, vencimientos, fórmula, modelo, madurez, confianza y censura. Permitir seleccionar ejecuciones y comparar demanda, meta, sugerencia, confianza y modelo. Abrir por defecto la última ejecución exitosa, avisando fallos posteriores.

**QA journey:** Abrir un producto con historia y recorrer las tres gráficas, componentes y lotes. Cambiar a una ejecución anterior y comparar. Abrir un producto inactivo y comprobar que conserva historia sin nueva recomendación. Simular un fallo posterior y verificar que la última exitosa permanece visible.

**Acceptance criteria:**

- Las gráficas distinguen observaciones, predicción, banda, stock y meta.
- El detalle identifica cortes, ejecución, configuración y versión.
- La comparación muestra cambios frente a la ejecución anterior.
- Un producto inactivo conserva historia y deja de recibir recomendaciones.
- Una ejecución fallida posterior no reemplaza el último resultado exitoso.
- Fechas operativas usan `America/La_Paz` y timestamps técnicos usan UTC.

### TB-06 — Administración descarga series y resultados en Parquet auditable

**User outcome:** Administrador y superadministrador descargan datos analíticos tipados para estudiar inventario y decisiones del motor fuera del sistema.

**Backend responsibility:** Generar bajo demanda dos archivos Parquet: serie temporal analítica y resultados predictivos. Admitir rango obligatorio de hasta cinco años y filtros opcionales por producto, categoría y proveedor; permitir seleccionar ejecución. Estimar filas y rechazar más de 1.000.000. Usar identificadores textuales, fecha local, timestamps UTC, decimales, booleanos, nulos tipados, compresión Zstandard y metadatos de versión. Incluir productos sin predicción e inactivos cuando coincidan. Transmitir sin conservar el archivo y auditar "archivo generado".

**UI behavior:** Ofrecer descargas desde Planificación de stock y Exportaciones. Solicitar rango y filtros, validar límites, descargar cuerpo binario y comunicar errores recuperables. Mantener CSV sin cambios. Explicar diferencia entre observaciones y resultados calculados.

**QA journey:** Como Administrador, descargar ambos archivos desde las dos superficies y comprobar nombres y estados. Abrirlos con un lector Parquet y comprobar tipos, metadatos y filas. Exceder el límite y verificar el rechazo sin archivo. Como Superadministrador, comprobar auditoría. Como Vendedor, confirmar acceso denegado.

**Acceptance criteria:**

- La serie temporal usa una fila por producto y fecha con demanda, operaciones, censura, stock, criticidad y cobertura.
- El resultado predictivo usa una fila por producto, ejecución y fecha con estimación, límites, meta, sugerencia, modelo, madurez, confianza y métricas.
- Los archivos declaran versión y compresión Zstandard.
- Fechas, timestamps, decimales, booleanos y nulos conservan tipos analíticos.
- Un archivo no supera 1.000.000 de filas ni cinco años.
- La generación no deja artefactos permanentes.
- La auditoría registra generación, no descarga completada.
- CSV continúa disponible.
- `admin` y `superadmin` pueden exportar; `seller` recibe denegación.

## Implementation Decisions

### Arquitectura y contratos

- La funcionalidad visible se denomina "Planificación de stock". "Pronóstico de demanda" y "Recomendación de reabastecimiento" son conceptos distintos.
- La recomendación es consultiva: no crea compras, no recibe inventario, no genera movimientos y no modifica lotes.
- El alcance es una sola farmacia con inventario global por producto, lote y vencimiento.
- El backend permanece como monolito modular TypeScript. HTTP, negocio estadístico y persistencia conservan responsabilidades separadas.
- El motor estadístico y el cálculo de reabastecimiento se exponen mediante interfaces puras y deterministas.
- Los contratos compartidos y schemas Zod definen configuración, ejecuciones, puntos, recomendaciones, filtros, alertas y exportaciones.
- El cliente usa una capa de datos portable; páginas, gráficas, textos, rutas e iconos permanecen fuera de ella.
- Los nombres técnicos están en inglés y toda experiencia visible del cliente está en español.

### Acceso y configuración

- `admin` y `superadmin` consultan y descargan; solo `superadmin` configura globalmente, activa o desactiva y recalcula.
- Ambos roles administrativos pueden cambiar criticidad, cobertura específica y presentación preferida por producto.
- La criticidad técnica es `normal`, `high` o `critical`; la UI muestra Normal, Alta y Crítica.
- La cobertura global inicial es 30 días. Una cobertura específica nula hereda el valor global.
- La presentación preferida referencia una conversión vigente. Sin ella, la recomendación queda en unidad base con advertencia.
- No se modelan tiempos de entrega, fechas prometidas, calendarios de proveedor, pedidos mínimos ni órdenes en tránsito.

### Demanda, modelos y confianza

- La referencia fría es `máximo(0, stock mínimo - stock utilizable)` y no se etiqueta como predicción.
- La demanda diaria usa ventas confirmadas, excluye anulaciones y resta devoluciones que reingresan inventario.
- Compras, ajustes, mermas, vencimientos y correcciones afectan stock, pero no son demanda comercial.
- Los días sin ventas con disponibilidad son cero; días completos sin disponibilidad son censurados y se excluyen del entrenamiento.
- Los picos operativos válidos se conservan.
- El entrenamiento usa como máximo los 24 meses más recientes.
- Los candidatos son ingenuo reciente, ingenuo estacional semanal, promedio móvil, suavizado exponencial simple, Holt, Croston-SBA y TSB.
- La selección usa backtesting de origen móvil, error escalado y sesgo. Un candidato debe superar baseline; ante empate gana el más simple.
- La estacionalidad anual requiere dos años completos; con menos historia se evalúa la semanal.
- No se usan promociones, precios históricos, clima, mercado ni fuentes epidemiológicas externas.
- Se persiste trayectoria diaria y banda central del 80%.
- La madurez es: Sin historial con menos de 12 semanas o menos de 4 días con demanda; Baja confianza con 12 semanas y 4 a 11 días; Predicción operativa con 12 semanas y al menos 12 días, sujeta a calidad.
- Confianza combina extensión, densidad, backtesting, censura y amplitud. No representa probabilidad de acierto.
- Tras 12 semanas sin ventas se muestra Sin demanda observada y recomendación cero, con advertencias aplicables.
- Si ningún modelo supera baseline, se publica baseline con confianza reducida.
- Valores visibles de demanda, límites, seguridad, meta y recomendación no pueden ser negativos.

### Reabastecimiento y vencimiento

- Los niveles de servicio son 90% normal, 95% alta y 99% crítica.
- La meta es el máximo entre stock mínimo y cuantil acumulado para la cobertura.
- El stock de seguridad es la diferencia no negativa entre cuantil y estimación central.
- El stock utilizable se calcula simulando consumo diario por FEFO.
- Vencido, bloqueado o excedente con riesgo de vencer se muestra separado.
- Las compras en borrador son contexto y nunca reducen la recomendación.
- La sugerencia es `máximo(0, meta - stock utilizable)` y se redondea hacia arriba.
- El costo estimado usa el último costo de compra confiable.

### Ejecución, snapshots e historial

- La configuración global versionada incluye activación, frecuencia, día, hora local, cobertura, niveles y umbrales. No expone cron ni hiperparámetros.
- La zona fija es `America/La_Paz`.
- La ejecución inicial es diaria a las 02:00, entrenando hasta el último día completo y capturando stock al comenzar.
- El recálculo manual usa demanda hasta el último día completo y stock actual; persiste ambos cortes.
- La coordinación usa bloqueo PostgreSQL, idempotencia y registro de ejecución.
- Tras una omisión, se ejecuta una única recuperación al arrancar.
- Los snapshots diarios son independientes del interruptor y conservan detalle por producto y lote.
- Los snapshots reconstruidos se identifican como tales.
- Las ejecuciones registran estado, disparador, cortes, configuración, motor, huella, duración, error global y advertencias por producto.
- Los estados son en curso, exitosa, exitosa con advertencias y fallida.
- Las ejecuciones son inmutables. Correcciones y configuraciones solo afectan ejecuciones futuras.
- Un fallo por producto no invalida los demás; conserva el último resultado exitoso marcado desactualizado.
- Un resultado queda desactualizado tras la siguiente ejecución esperada más seis horas o por cambio relevante.
- Movimientos y snapshots se conservan indefinidamente; predicciones y métricas al menos 24 meses.
- Los productos inactivos no reciben nuevas recomendaciones, pero conservan historia.

### Experiencia, alertas y Parquet

- Las alertas se derivan del último resultado y no tienen reconocimiento manual en V1.
- Prioridad crítica: agotamiento de producto crítico o fallo global; alta: reabastecimiento urgente o desactualización; media: vencimiento o baja confianza; informativa: historia insuficiente.
- El dashboard muestra conteos de productos, no suma unidades incompatibles.
- El detalle ofrece demanda frente a pronóstico, stock frente a meta y error/sesgo histórico.
- La comparación se limita a una ejecución y la anterior inmediata.
- Los esquemas Parquet se versionan; cambios incompatibles crean nueva versión.
- Parquet usa identificadores de texto, fechas locales, timestamps UTC, decimales, booleanos, nulos y Zstandard.
- El rango obligatorio no supera cinco años ni 1.000.000 de filas.
- Los archivos se transmiten bajo demanda, no se almacenan y generan auditoría de "archivo generado".
- Los CSV vigentes permanecen sin cambios.

### Datos sintéticos y capacidad

- El generador es un comando TypeScript independiente y determinista por semilla.
- Se niega a ejecutar en producción y exige base no productiva vacía; reemplazar datos requiere bandera destructiva explícita.
- Los perfiles son pequeño, estándar y estrés. El estándar genera 250 productos y 24 meses.
- Los escenarios combinan binomial negativa, ocurrencia Bernoulli, cantidades discretas, multiplicadores semanales, estacionales, tendencia y pulsos de brote.
- Genera categorías, productos, unidades, proveedores, compras, demoras de recepción, lotes, ventas, FEFO, caja, pagos, movimientos, devoluciones, ajustes y auditoría coherentes.
- Los datos farmacéuticos son ficticios, en español y no válidos para uso sanitario o regulatorio.
- No contiene datos personales reales ni pacientes.
- El generador no crea predicciones; el motor real procesa la historia sintética.
- Cada escenario produce manifiesto JSON y Parquet de demanda latente y eventos con identificador común.
- Los datos sintéticos nunca se cargan ni entrenan producción.
- La capacidad objetivo es hasta 5.000 productos y 24 meses, con cálculo nocturno menor a diez minutos en un equipo de desarrollo razonable.

## Testing Decisions

- Las pruebas automatizadas forman parte de cada ticket de implementación y no sustituyen el QA autorizado.
- El seam principal del motor recibe una serie diaria, cobertura, calendario y configuración versionada, y devuelve candidato, puntos, intervalos y métricas con reloj y aleatoriedad controlados.
- El seam de recomendación recibe pronóstico, criticidad, stock mínimo, lotes, cobertura y presentación, y devuelve meta, stock utilizable, riesgo y sugerencia.
- Probar series estables, semanales, crecientes, intermitentes, sin demanda, censuradas y con picos válidos.
- Probar modelos intermitentes con fixtures deterministas sin afirmar detalles internos.
- Probar backtesting por cortes cronológicos, métricas, sesgo, baseline y desempate simple.
- Probar las fronteras exactas de madurez.
- Probar FEFO con lotes consumibles, parcialmente consumibles, vencidos y bloqueados.
- Probar cuantiles, stock mínimo, compras en borrador, redondeo y costo ausente.
- Probar servicios con repositorios falsos para configuración, permisos, ejecuciones, fallos parciales, vigencia, alertas y auditoría.
- Probar persistencia aislada para agregación diaria, censura, snapshots, reconstrucción, inmutabilidad, filtros e idempotencia.
- Probar scheduler con reloj falso y seam de bloqueo para frecuencia, recuperación, motor desactivado y snapshots independientes.
- Probar contratos HTTP y roles administrativos frente a vendedor.
- Probar Parquet mediante escritura y lectura de vuelta: tipos, decimales, UTC, fecha local, metadatos, versión, compresión, filtros, límites y auditoría.
- Probar que exportaciones rechazadas no registran generación exitosa.
- Probar el módulo frontend en API, facade, store, hooks y selectores para carga, vacío, error, filtros, configuración, recálculo, detalle, comparación y descargas.
- Conservar la prueba arquitectónica que impide UI, router, iconos y estilos dentro de módulos de datos.
- Probar el generador por semilla, perfiles, bloqueo productivo, base vacía y coherencia entre operaciones y verdad latente.
- Reutilizar como precedentes los seams actuales de reportes, exportaciones, inventario, ventas, devoluciones, compras, auditoría y módulos administrativos.

## QA Decisions

- El usuario autorizó explícitamente QA manual para esta funcionalidad.
- `to-tickets` debe crear un único ticket QA después del Code Review de TB-06 y antes del ticket de documentación.
- El ticket QA debe declarar `Execution owner: ORCHESTRATOR` y constituye la autorización para usar Computer Use.
- El orquestador ejecutará QA directamente; no puede delegarlo ni crear un subagente para QA.
- QA debe leer las instrucciones raíz, asumir que el servidor de desarrollo ya está levantado y usar el navegador integrado.
- QA ejecutará los seis journeys del spec en orden, además de carga, vacío, error recuperable, acceso denegado, configuración inconsistente, conflicto concurrente, ejecución fallida, producto inactivo, límites Parquet y disposición adaptable.
- El entorno QA será no productivo, con cuentas `superadmin`, `admin` y `seller`, un escenario sintético estándar preparado y un lector Parquet disponible.
- QA es correctivo: puede modificar backend, frontend, contratos y pruebas, y debe repetir todo journey afectado.
- La evidencia y correcciones se registrarán en `Comments` del ticket QA.
- QA permanecerá `TODO` hasta que todos los recorridos y rechecks aplicables pasen.

## User Documentation

Después de que QA valide la funcionalidad, la documentación administrativa debe explicar:

- diferencia entre referencia configurada, pronóstico y recomendación;
- estados de madurez y confianza;
- cobertura global y específica;
- criticidades y niveles de protección;
- demanda central, banda, error y sesgo;
- stock mínimo, seguridad, FEFO, lotes, vencimientos y presentaciones;
- por qué compras en borrador y stock no utilizable no reducen la recomendación;
- configuración programada, snapshots y recálculo manual;
- alertas, historial, comparación y gráficas;
- filtros y ambos esquemas Parquet;
- arranque sin datos, demanda censurada y ausencia de variables externas;
- que la recomendación no crea compras, no reserva stock y no modifica inventario.

La documentación se redactará en español con terminología farmacéutica especializada. No describirá archivos, carpetas, capas ni organización interna del código. Solo documentará comportamiento validado por QA.

## Out of Scope

- Crear, aprobar, recibir o modificar compras desde una recomendación.
- Descontar compras en borrador o modelar órdenes en tránsito.
- Tiempo de entrega, fecha prometida, calendario de proveedor o pedido mínimo contractual.
- Automatización de compras o modificación automática de inventario.
- Selección manual de modelo o edición de hiperparámetros desde la UI.
- Machine learning opaco, redes neuronales o microservicio Python.
- Variables externas de promociones, precios, clima, mercado o epidemiología.
- Captura explícita de demanda no satisfecha en POS.
- Pacientes, diagnósticos, recetas e historias clínicas.
- Multi-sucursal, multi-almacén o multi-tenant.
- Data warehouse o BI avanzado.
- Parquet asíncrono, almacenamiento de artefactos o URLs firmadas.
- Reemplazar las exportaciones CSV.
- Marcar recomendaciones como aceptadas, ignoradas o ejecutadas.
- Reconocimiento manual de alertas.
- Comparar simultáneamente más de dos ejecuciones.
- Notificaciones por correo, WhatsApp, SMS o push.
- Integración SIAT o cambios de facturación.
- Garantías de precisión comercial, clínica o epidemiológica.
- Cargar datos sintéticos en producción o usarlos para entrenarla.

## Further Notes

- La base productiva vacía permite iniciar snapshots y trazabilidad desde el primer día.
- El valor inicial será principalmente "Sin historial"; los datos sintéticos no deben ocultar esa realidad.
- Los escenarios se describirán como estadísticamente plausibles, no como reproducción certificada del mercado boliviano.
- Esta funcionalidad amplía reportes y exportaciones con analítica predictiva y Parquet, pero mantiene fuera de alcance data warehouse.
- No existen ADR publicadas aplicables.
- El historial operacional tiene como fuentes principales movimientos, ventas, compras, lotes y devoluciones.
- La capacidad es un objetivo de ingeniería, no una garantía absoluta.
- El siguiente paso es generar tickets secuenciales con `to-tickets`, incluyendo QA autorizado y documentación posterior.
