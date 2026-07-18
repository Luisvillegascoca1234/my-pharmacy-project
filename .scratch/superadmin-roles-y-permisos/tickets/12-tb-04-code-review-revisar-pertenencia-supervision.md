# 12 — [CODE REVIEW] TB-04 — Revisar y corregir pertenencia y supervision

**Status:** TODO
**Objective:** CODE REVIEW
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-04 — Las operaciones compartidas respetan pertenencia y supervision
**Blocked by:** [11 — Comunicar alcance propio y facultades de supervision](./11-tb-04-ui-comunicar-alcance-supervision.md)

## Outcome

Las reglas contextuales y su comunicacion quedan revisadas y corregidas como cierre de los tracer bullets. La implementacion preserva las fronteras de caja, inventario, ventas y auditoria sin duplicar reglas sensibles en el cliente.

## Acceptance criteria

- [ ] Se revisan conjuntamente servicios, endpoints, respuestas, UI y pruebas de TB-04.
- [ ] Se corrige toda divergencia entre `canCancel`, alcance de consulta, filtros visibles y autorizacion efectiva.
- [ ] Se eliminan codigo muerto, comentarios mecanicos, duplicacion, wrappers innecesarios, compatibilidad no solicitada y TODO evitables.
- [ ] Se corrigen nombres debiles, escapes de tipos injustificados, errores incompletos y unidades de codigo sobredimensionadas.
- [ ] Las reglas de pertenencia, estado, caja, inventario y auditoria permanecen en sus limites de dominio.
- [ ] El codigo permanece en ingles y los mensajes operativos en espanol farmaceutico comprensible.
- [ ] Todos los hallazgos en alcance se corrigen antes de habilitar QA.
- [ ] Las pruebas automatizadas relevantes quedan pasando sin ejecutar QA visual.

## Comments

