# 13 — [QA] Validar integralmente Roles y facultades

**Status:** TODO
**Objective:** QA
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** All tracer bullets
**Blocked by:** [12 — Revisar y corregir pertenencia y supervision](./12-tb-04-code-review-revisar-pertenencia-supervision.md)

## Outcome

La funcionalidad completa queda validada mediante Computer Use en el navegador integrado. Los recorridos de los cuatro tracer bullets, sus estados de error y sus restricciones por rol pasan de extremo a extremo; cualquier defecto encontrado se corrige y los recorridos afectados se repiten antes de cerrar QA.

## Acceptance criteria

- [ ] Se lee `AGENTS.md` antes de actuar y se respetan sus reglas de idioma, entorno y alcance.
- [ ] Se asume que el servidor de desarrollo ya esta levantado y se usa Computer Use mediante el navegador integrado, no solo inspeccion de codigo.
- [ ] Se ejecuta el journey de TB-01 para matriz, disposicion estrecha, acceso denegado y error recuperable.
- [ ] Se ejecuta el journey de TB-02 para login, restauracion de sesion y cambio de rol de una cuenta de prueba.
- [ ] Se ejecuta el journey de TB-03 comparando navegacion y acceso directo de los tres roles.
- [ ] Se ejecuta el journey de TB-04 con registros de dos vendedores, alcance propio, supervision y bloqueos de anulacion.
- [ ] Se cubren los estados relevantes de carga, configuracion inconsistente, `403` y mensajes operativos bloqueados.
- [ ] Todo defecto en alcance se corrige en backend, frontend, contratos o pruebas segun corresponda.
- [ ] Despues de cada correccion se repiten todos los journeys afectados.
- [ ] El ticket permanece `TODO` hasta que todos los recorridos aplicables pasen y la evidencia quede registrada en Comments.

## Comments

