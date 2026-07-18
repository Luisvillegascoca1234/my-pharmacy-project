/goal Toma el spec {SPEC_REFERENCE} e implementa todos sus tickets en el orden en que ya fueron definidos. Crea un subagente nuevo para cada ticket y ejecútalos de forma estrictamente secuencial hasta completar el objetivo del spec.

Actúa como orquestador; no implementes los tickets directamente.

Para cada ticket pendiente:

1. Toma el primer ticket `TODO` de la cadena existente. No reordenes, regeneres ni omitas tickets.
2. Crea un subagente nuevo dedicado exclusivamente a ese ticket.
3. Entrégale la referencia exacta al spec y al ticket. Indícale que implemente todos sus criterios de aceptación, use los skills aplicables y no trabaje en tickets posteriores.
4. Indícale que no cambie el estado del ticket a `DONE`.
5. Espera a que termine y exígele un reporte con:
   - resultado;
   - criterios de aceptación satisfechos;
   - archivos modificados;
   - validaciones realizadas;
   - pendientes o bloqueos.
6. Si queda un criterio corregible, solicita la corrección al mismo subagente y vuelve a esperar.
7. Cuando todos los criterios estén satisfechos:
   - marca el ticket como `DONE`;
   - cierra también la incidencia si pertenece a un tracker externo;
   - considera cerrado al subagente si ya está completado, o interrúmpelo si continúa activo;
   - crea un subagente nuevo para el siguiente ticket `TODO`.
8. Si existe un bloqueo que necesita intervención del usuario, no marques el ticket como `DONE`, no avances y reporta claramente qué se necesita.

Mantén un solo subagente activo. Nunca ejecutes tickets en paralelo. Respeta literalmente el alcance y las autorizaciones de cada ticket, incluidos los tickets correctivos de Code Review y QA y el ticket final de documentación.

Antes de completar el `/goal`, confirma que todos los tickets estén en `DONE` y que el objetivo completo del spec esté satisfecho. Si el task se reanuda, continúa desde el primer `TODO` sin repetir tickets terminados.
