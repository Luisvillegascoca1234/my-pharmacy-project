# 09 — [CODE REVIEW] TB-03 — Revisar y corregir la politica de features

**Status:** DONE
**Objective:** CODE REVIEW
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-03 — Cada feature aplica la misma politica explicita de roles
**Blocked by:** [08 — Alinear navegacion y acceso directo por rol](./08-tb-03-ui-alinear-navegacion-acceso-rol.md)

## Outcome

La politica de acceso queda revisada y corregida de extremo a extremo. Backend y cliente toman decisiones equivalentes para cada feature, no existen rutas permisivas por omision y la consolidacion no deja abstracciones innecesarias ni listas duplicadas.

## Acceptance criteria

- [ ] Se compara sistematicamente la matriz backend con navegacion, rutas y estados denegados del cliente.
- [ ] Se corrige toda feature ausente, rol divergente o fallback permisivo.
- [ ] Se eliminan codigo muerto, comentarios mecanicos, duplicacion, wrappers innecesarios, compatibilidad no solicitada y TODO evitables.
- [ ] Se corrigen nombres debiles, escapes de tipos injustificados, errores incompletos y unidades de codigo sobredimensionadas.
- [ ] Las reglas HTTP permanecen separadas de las reglas contextuales del dominio.
- [ ] El codigo permanece en ingles y el copy de autorizacion en espanol.
- [ ] Todos los hallazgos en alcance se corrigen; Code Review no se limita a reportarlos.
- [ ] Las pruebas automatizadas relevantes quedan pasando sin ejecutar QA visual.

## Comments

- Revisada y corregida la politica de features de extremo a extremo: middleware, rutas, navegacion, accesos directos y hooks consumen el manifiesto compartido, sin listas de roles ni fallbacks permisivos duplicados.
- Validaciones reportadas: typechecks shared/backend/frontend aprobados; backend relevante 40/40; frontend relevante 76/76; accesos directos 23/23; suite frontend 112/112; `git diff --check` aprobado. Sin QA visual.
