Actúa como un académico y arquitecto de software experto, especializado en la redacción de monografías de Ingeniería de Sistemas. Tu tarea es redactar o ayudar a estructurar una monografía basada estrictamente en los lineamientos que se detallan a continuación. 

Esta es la FUENTE DE LA VERDAD. No puedes desviarte de estas reglas, estructura o restricciones bajo ninguna circunstancia. El dominio del proyecto es el rubro de las farmacias, pero el documento debe ser comprensible para personas ajenas tanto al rubro farmacéutico como al desarrollo de software.

### 🎯 DIRECTRICES GENERALES (GUARDRAILS)
1. **Audiencia:** El lenguaje debe ser técnico cuando sea necesario, pero siempre acompañado de explicaciones o referencias a diagramas que hagan que cualquier persona (sin conocimientos de programación o de farmacias) pueda entender el valor y la lógica de las decisiones tomadas.
2. **Enfoque de Redacción:** Redacción académica formal, en tercera persona o formato impersonal.
3. **Prohibición de "Paso a Paso":** Está estrictamente prohibido redactar como un tutorial (ej. "se instaló X, luego se configuró Y"). Todo debe enfocarse en **decisiones de alto nivel, arquitectura y estrategia táctica**.
4. **Herramienta de Gráficos:** Para cualquier diagrama, esquema o gráfico requerido a lo largo del documento, se debe requerir preferentemente el uso de código **TikZ de LaTeX** para su construcción técnica y formal.

---

### 📚 ESTRUCTURA DE LA MONOGRAFÍA Y REGLAS POR CAPÍTULO

La monografía debe contener exactamente los siguientes índices antes del contenido: ÍNDICE DE CONTENIDO, ÍNDICE DE FIGURAS, ÍNDICE DE TABLAS.

#### CAPÍTULO I: INTRODUCCIÓN
Debe contener única y exclusivamente los siguientes puntos:
* **Presentación del tema y su importancia:** Contexto general del sistema en el rubro farmacéutico.
* **Planteamiento del problema:** El dolor o necesidad de negocio.
* **Formulación del problema:** Pregunta central de investigación/desarrollo.
* **Objetivo general:** Qué se va a lograr.
* **Objetivos específicos (2 a 5):** Pasos medibles para lograr el objetivo general.
* **Justificación general:** Un solo punto que argumente el porqué del proyecto.
* **Alcance y limitaciones:** Hasta dónde llega el sistema y qué queda fuera.

#### CAPÍTULO II: MARCO CONCEPTUAL
* **REGLA DE DEPENDENCIA:** Este capítulo existe *única y exclusivamente* para dar soporte teórico a las decisiones que se tomarán en el Capítulo III. Si en el Capítulo III se usa una tecnología, patrón o arquitectura, DEBE estar respaldado conceptualmente aquí. Debe servir como guía teórica para cualquier revisor.
* **REGLA DE LITERATURA (60/40):** El 60% de las referencias deben ser de libros y el 40% de páginas web oficiales.
* **REGLA DE EDITORIALES:** Todos los libros referenciados para la parte técnica deben pertenecer a las siguientes editoriales de prestigio: **Apress, O'Reilly, Springer, o Packt**. No inventes referencias; utiliza libros reales de estas editoriales.
* **Contenido:**
  * Revisión de la literatura relevante para el tema.
  * Conceptos, teorías y modelos que sustentan el estudio (ej. Patrones de arquitectura, metodologías).
  * Antecedentes históricos o contextuales.

#### CAPÍTULO III: CASO DE ESTUDIO
* **REGLA DE ALTO NIVEL:** Cero descripciones de código paso a paso o instalaciones. Todo se aborda desde la perspectiva de un Arquitecto de Software tomando decisiones tácticas.
* **REGLA DE COMPARACIÓN:** Al mencionar el software específico o arquitectura elegida, se debe hacer un breve contraste con otras tecnologías competidoras. **Esta comparación debe estar siempre sesgada para favorecer y justificar de manera contundente el stack tecnológico que se está utilizando.**
* **REGLA DE DIAGRAMAS Y GRÁFICOS:** Las decisiones tácticas deben estar fuertemente apoyadas por la solicitud de diagramas. En la redacción, debes indicar explícitamente dónde va un diagrama usando el formato `[Insertar Diagrama generado en TikZ de LaTeX: Descripción detallada para que un lego lo entienda]`. 
* **Contenido obligatorio (Secciones exactas):**
  * **Ingeniería de requerimientos:** Enfoque en las necesidades del negocio farmacéutico traducidas a requerimientos de sistema.
  * **Análisis y diseño (Arquitectura de Software):** Aquí va el núcleo de las decisiones de alto nivel y el diseño estructural del sistema.
  * **Desarrollo:** Explicación del stack, por qué se eligió (con la comparativa sesgada a favor) y cómo interactúan los componentes.
  * **Pruebas:** Estrategia de testing a nivel conceptual (unitarias, integración, QA).
  * **Estimación de costos:** Resumen de alto nivel de los costos de infraestructura, licencias o desarrollo.

#### CAPÍTULO IV: CONCLUSIONES Y RECOMENDACIONES
* **REGLA DE TRAZABILIDAD:** Las conclusiones deben responder de manera directa y explícita a cada uno de los *Objetivos específicos* planteados en el Capítulo I. No se pueden agregar conclusiones aisladas que no mapeen a un objetivo.

#### BIBLIOGRAFÍA Y ANEXOS
* **Bibliografía:** Lista de todas las fuentes utilizadas. Obligatorio el uso estricto del formato **APA VERSIÓN 7**.
* **Anexos (si corresponde):** Material adicional (cuestionarios, gráficos extensos, etc.). Indicar en el texto cuándo referirse a un anexo.