/goal Toma el spec {SPEC_REFERENCE} e implementa todos sus tickets en el orden en que ya fueron definidos. Crea un subagente nuevo para cada ticket que no sea QA; ejecuta siempre los tickets QA directamente como orquestador. Mantén toda la cadena estrictamente secuencial hasta completar el objetivo del spec.

Actúa como orquestador. No implementes directamente tickets BACKEND, UI, CODE REVIEW o DOCS. La única excepción obligatoria es QA, que debes ejecutar directamente y nunca delegar a un subagente.

Para cada ticket pendiente:

1. Toma el primer ticket `TODO` de la cadena existente. No reordenes, regeneres ni omitas tickets.
2. Lee `Objective` antes de asignar el trabajo. Si es `QA`, sigue el flujo QA directo descrito abajo. Para cualquier otro objetivo, crea un subagente nuevo dedicado exclusivamente a ese ticket.
3. Para un ticket no-QA, entrégale la referencia exacta al spec y al ticket. Indícale que implemente todos sus criterios de aceptación, use los skills aplicables y no trabaje en tickets posteriores.
4. Indícale al subagente no-QA que no cambie el estado del ticket a `DONE`.
5. Espera a que termine y exígele un reporte con:
   - resultado;
   - criterios de aceptación satisfechos;
   - archivos modificados;
   - validaciones realizadas;
   - pendientes o bloqueos.
6. Si queda un criterio corregible en un ticket no-QA, solicita la corrección al mismo subagente y vuelve a esperar.
7. Cuando todos los criterios de un ticket no-QA estén satisfechos:
   - marca el ticket como `DONE`;
   - cierra también la incidencia si pertenece a un tracker externo;
   - considera cerrado al subagente si ya está completado, o interrúmpelo si continúa activo;
   - continúa con el siguiente ticket `TODO`, creando un subagente nuevo solo si no es QA.
8. Si existe un bloqueo que necesita intervención del usuario, no marques el ticket como `DONE`, no avances y reporta claramente qué se necesita.

Para cada ticket QA:

1. Reconócelo por `Objective: QA`; `Execution owner: ORCHESTRATOR` puede reforzarlo, pero no es obligatorio en tickets antiguos.
2. No crees, asignes ni reutilices un subagente para QA.
3. Lee el ticket, `AGENTS.md` y los skills de navegador, Computer Use y arquitectura aplicables.
4. Ejecuta directamente todos los journeys y estados exigidos mediante el navegador integrado.
5. Corrige directamente todos los defectos en alcance y repite los journeys afectados.
6. Registra la evidencia requerida en `Comments` y marca QA como `DONE` solo cuando todos sus criterios estén satisfechos.
7. Si QA necesita intervencion del usuario, mantenlo en `TODO`, no avances y reporta el bloqueo.

Mantén un solo subagente activo para tickets no-QA. Nunca ejecutes tickets en paralelo ni mantengas un subagente activo mientras ejecutas QA. Respeta literalmente el alcance y las autorizaciones de cada ticket, incluidos los tickets correctivos de Code Review y QA y el ticket final de documentación.

Antes de completar el `/goal`, confirma que todos los tickets estén en `DONE` y que el objetivo completo del spec esté satisfecho. Si el task se reanuda, continúa desde el primer `TODO` sin repetir tickets terminados.
