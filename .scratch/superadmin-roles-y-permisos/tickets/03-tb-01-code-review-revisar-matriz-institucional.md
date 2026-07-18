# 03 — [CODE REVIEW] TB-01 — Revisar y corregir la matriz institucional

**Status:** TODO
**Objective:** CODE REVIEW
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-01 — El superadministrador consulta la matriz institucional de roles
**Blocked by:** [02 — Construir la pantalla Roles y facultades](./02-tb-01-ui-construir-pantalla-roles-facultades.md)

## Outcome

El tracer bullet completo queda revisado y corregido como una rebanada funcional estable. La consulta, los contratos y la pantalla coinciden con el spec y no introducen duplicacion, abstracciones prematuras ni dependencias visuales en la logica de datos.

## Acceptance criteria

- [ ] Se revisan conjuntamente el comportamiento backend, los contratos, la UI y las pruebas de TB-01.
- [ ] Se corrige toda divergencia entre la respuesta efectiva y la matriz visible.
- [ ] Se eliminan codigo muerto, comentarios mecanicos, duplicacion, fallbacks innecesarios, compatibilidad no solicitada y TODO evitables.
- [ ] Se corrigen nombres debiles, escapes de tipos injustificados, errores incompletos y funciones o componentes sobredimensionados.
- [ ] El backend conserva sus limites de HTTP, negocio y persistencia, y el cliente conserva sus limites entre datos y presentacion.
- [ ] El codigo permanece en ingles y la experiencia visible en espanol con vocabulario farmaceutico consistente.
- [ ] Todos los hallazgos en alcance se corrigen; el ticket no termina como informe de observaciones.
- [ ] Las pruebas automatizadas relevantes quedan pasando sin ejecutar QA visual.

## Comments

