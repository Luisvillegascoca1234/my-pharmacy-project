# 13 — [QA] Validar integralmente Roles y facultades

**Status:** DONE
**Objective:** QA
**Execution owner:** ORCHESTRATOR
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** All tracer bullets
**Blocked by:** [12 — Revisar y corregir pertenencia y supervision](./12-tb-04-code-review-revisar-pertenencia-supervision.md)

## Outcome

La funcionalidad completa queda validada mediante Computer Use en el navegador integrado. Los recorridos de los cuatro tracer bullets, sus estados de error y sus restricciones por rol pasan de extremo a extremo; cualquier defecto encontrado se corrige y los recorridos afectados se repiten antes de cerrar QA.

## Acceptance criteria

- [x] Se lee `AGENTS.md` antes de actuar y se respetan sus reglas de idioma, entorno y alcance.
- [x] Se asume que el servidor de desarrollo ya esta levantado y se usa Computer Use mediante el navegador integrado, no solo inspeccion de codigo.
- [x] Se ejecuta el journey de TB-01 para matriz, disposicion estrecha, acceso denegado y error recuperable.
- [x] Se ejecuta el journey de TB-02 para login, restauracion de sesion y cambio de rol de una cuenta de prueba.
- [x] Se ejecuta el journey de TB-03 comparando navegacion y acceso directo de los tres roles.
- [x] Se ejecuta el journey de TB-04 con registros de dos vendedores, alcance propio, supervision y bloqueos de anulacion.
- [x] Se cubren los estados relevantes de carga, configuracion inconsistente, `403` y mensajes operativos bloqueados.
- [x] Todo defecto en alcance se corrige en backend, frontend, contratos o pruebas segun corresponda.
- [x] Despues de cada correccion se repiten todos los journeys afectados.
- [x] El ticket permanece `TODO` hasta que todos los recorridos aplicables pasen y la evidencia quede registrada en Comments.

## Comments

- QA bloqueado antes de iniciar los journeys: `agent.browsers.get("iab")` respondio `Browser is not available: iab`; `agent.browsers.list()` expuso unicamente Chrome mediante extension y Computer Use no encontro una ventana independiente del navegador integrado.
- No se sustituyo `iab` por otro backend porque el skill Browser lo prohibe, ni se automatizo la aplicacion Codex porque el skill Computer Use lo prohibe. No se modifico codigo. Se requiere abrir o habilitar el navegador integrado y reanudar desde el journey TB-01.
- Segundo intento de reanudacion: `agent.browsers.get("iab")` volvio a responder `Browser is not available: iab`; la lista de navegadores continuo mostrando solo Chrome de tipo `extension` y Computer Use solo encontro Codex y Chrome. Los journeys TB-01 a TB-04 no se iniciaron y no se modifico codigo.
- Tercer intento de reanudacion: `agent.browsers.get("iab")` continuo respondiendo `Browser is not available: iab`; `agent.browsers.list()` devolvio unicamente Chrome de tipo `extension`. Se mantiene el bloqueo de infraestructura, sin journeys ejecutados ni archivos de implementacion modificados.
- Bloqueo resuelto al ejecutar QA directamente desde el orquestador con el navegador integrado disponible. No se reutilizo ni delego el subagente previamente bloqueado.
- TB-01 aprobado: la matriz mostro exactamente los tres roles, seis areas y cuatro niveles, sin acciones de edicion; la disposicion estrecha se apilo por rol; Administrador y Vendedor recibieron acceso denegado. Se indujo de forma controlada un catalogo persistido incompleto y la UI mostro `Inconsistencia de configuración`; restaurado el catalogo, `Reintentar` recupero la matriz. Tambien se detuvo temporalmente el backend con la sesion cargada, se observo `No se pudo cargar la política de roles` y el reintento recupero la pantalla tras reiniciar el servicio.
- TB-02 aprobado: login y restauracion de sesion conservaron identidad y rol para Superadministrador, Administrador y Vendedor; una cuenta de prueba cambio de Vendedor a Administrador y adopto inmediatamente la navegacion correspondiente, luego se restauro a Vendedor. Usuarios no expuso permisos configurables.
- TB-03 aprobado: se compararon las navegaciones de los tres roles y se probaron rutas directas. Administrador y Vendedor recibieron la experiencia `Acceso no autorizado` donde correspondia; Vendedor quedo sin movimientos, ajustes, compras, comprobantes, devoluciones, reportes, exportaciones ni gobierno; Administrador quedo sin gobierno, SIAT ni auditoria completa.
- TB-04 aprobado con dos vendedores: cada vendedor vio solo su caja, ventas y pendientes; Administrador vio ambos vendedores en Cajas, Ventas y Pendientes de Supervisión POS. Una venta propia fue anulada con caja abierta y con motivo visible; otra venta quedo bloqueada al cerrar la caja con el mensaje `La caja asociada está cerrada; la venta ya no admite anulación operativa`.
- Defecto correctivo encontrado por la ampliacion solicitada durante QA: el seed no dejaba la farmacia lista para operar y su limpieza fallaba si existian pendientes. Se corrigio `backend/prisma/seed.ts` para limpiar dependencias en orden, crear cuentas de los tres roles, 33 unidades, categoria, proveedor, producto, lote, compra recibida, movimiento y auditoria. El seed se ejecuto dos veces consecutivas y dejo exactamente tres roles, tres usuarios de desarrollo y 100 UND vendibles del lote `LOTE-DEMO-001`.
- Repeticion posterior a la correccion: desde la UI se inicio sesion con `vendedor@farmacia.local`, se abrio caja y se confirmo una venta de `Paracetamol 500 mg` consumiendo FEFO del lote sembrado. La matriz y el alcance de navegacion tambien se revalidaron con la base reconstruida.
- Validaciones automatizadas finales: backend 24 archivos/188 pruebas aprobadas; frontend 15 archivos/121 pruebas aprobadas; `pnpm typecheck` completo aprobado para shared, backend, frontend y docs-app. No quedan defectos ni bloqueos de QA.
