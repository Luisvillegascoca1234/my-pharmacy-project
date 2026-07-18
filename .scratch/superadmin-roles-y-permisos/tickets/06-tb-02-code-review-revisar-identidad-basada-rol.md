# 06 — [CODE REVIEW] TB-02 — Revisar y corregir la identidad basada en rol

**Status:** TODO
**Objective:** CODE REVIEW
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-02 — La identidad autenticada depende unicamente del rol fijo
**Blocked by:** [05 — Adaptar sesion y usuarios al contrato basado en rol](./05-tb-02-ui-adaptar-sesion-usuarios-rol.md)

## Outcome

La eliminacion del modelo dinamico queda revisada de extremo a extremo. Persistencia, seed, contratos, OpenAPI, autenticacion y cliente usan una sola identidad basada en rol, sin ramas de compatibilidad ni restos funcionales de permisos.

## Acceptance criteria

- [ ] Se revisan conjuntamente migracion, seed, contratos, autenticacion, usuarios, UI y pruebas de TB-02.
- [ ] Se corrige toda referencia activa o fallback relacionado con permisos persistidos o `permissions`.
- [ ] Se eliminan codigo muerto, comentarios mecanicos, duplicacion, wrappers innecesarios, compatibilidad no solicitada y TODO evitables.
- [ ] Se corrigen nombres debiles, escapes de tipos injustificados, errores incompletos y unidades de codigo sobredimensionadas.
- [ ] La persistencia permanece encapsulada y los contratos compartidos no filtran detalles del ORM.
- [ ] El codigo permanece en ingles y la experiencia visible en espanol.
- [ ] Todos los hallazgos en alcance se corrigen antes de marcar el ticket como `DONE`.
- [ ] Las pruebas automatizadas relevantes quedan pasando sin ejecutar QA visual.

## Comments

