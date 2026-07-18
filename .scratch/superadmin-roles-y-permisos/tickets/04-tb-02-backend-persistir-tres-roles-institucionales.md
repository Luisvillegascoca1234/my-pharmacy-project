# 04 — [BACKEND] TB-02 — Persistir unicamente los tres roles institucionales

**Status:** DONE
**Objective:** BACKEND
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-02 — La identidad autenticada depende unicamente del rol fijo
**Blocked by:** [03 — Revisar y corregir la matriz institucional](./03-tb-01-code-review-revisar-matriz-institucional.md)

## Outcome

La persistencia, autenticacion y administracion de usuarios reconocen unicamente los tres roles institucionales. Los permisos persistidos y sus relaciones desaparecen, las respuestas dejan de exponer `permissions` y la base de desarrollo puede reconstruirse de forma coherente con el nuevo modelo.

## Acceptance criteria

- [ ] La persistencia impide un cuarto nombre de rol y mantiene la unicidad de los tres nombres validos.
- [ ] La migracion progresiva elimina el catalogo y las asignaciones de permisos sin reescribir el historial anterior.
- [ ] El seed idempotente crea o sincroniza exactamente Superadministrador, Administrador y Vendedor.
- [ ] Los contratos de login, sesion actual y usuarios dejan de incluir `permissions`.
- [ ] Las consultas de autenticacion y usuarios dejan de cargar relaciones de permisos.
- [ ] La asignacion de cualquiera de los tres roles a un usuario continua funcionando.
- [ ] La proteccion del ultimo Superadministrador activo permanece vigente.
- [ ] OpenAPI refleja el enum de roles y la eliminacion incompatible de `permissions`.
- [ ] Las pruebas automatizadas cubren persistencia, seed, autenticacion y administracion de usuarios afectada.

## Comments

- Restringida la persistencia a los tres roles institucionales mediante enum, migracion progresiva y seed idempotente; autenticacion y usuarios dejaron de consultar o exponer permisos dinamicos.
- Validaciones reportadas: Prisma valido y cliente generado; typechecks/build aprobados; pruebas focalizadas TB-01/TB-02 17/17; `git diff --check` aprobado. La suite backend global conserva tres fallas temporales ajenas en carritos pendientes.
