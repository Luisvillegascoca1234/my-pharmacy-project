# 05 — [UI] TB-02 — Adaptar sesion y usuarios al contrato basado en rol

**Status:** DONE
**Objective:** UI
**Spec:** [Roles y facultades](../spec.md)
**Tracer bullet:** TB-02 — La identidad autenticada depende unicamente del rol fijo
**Blocked by:** [04 — Persistir unicamente los tres roles institucionales](./04-tb-02-backend-persistir-tres-roles-institucionales.md)

## Outcome

El cliente inicia y restaura sesiones utilizando exclusivamente la identidad y el rol institucional. La gestion de usuarios conserva la asignacion de rol sin depender de permisos ni sugerir que las facultades puedan configurarse.

## Acceptance criteria

- [ ] Login y restauracion de sesion consumen correctamente el contrato sin `permissions`.
- [ ] La identidad visible y el estado autenticado se derivan del rol institucional.
- [ ] La gestion de usuarios lista los tres roles y permite asignarlos desde la cuenta Superadministrador.
- [ ] Ninguna superficie cliente muestra, calcula o conserva claves de permisos obsoletas.
- [ ] Cambiar el rol de un usuario actualiza su representacion visible de manera coherente.
- [ ] Los estados de error de sesion y gestion de usuarios siguen comunicandose en espanol.
- [ ] Las pruebas frontend afectadas se actualizan para el contrato basado en rol.

## Comments

- Adaptados login, restauracion de sesion y gestion de usuarios al contrato basado exclusivamente en identidad y rol institucional; eliminadas las referencias cliente a permisos obsoletos y normalizados los errores visibles en espanol.
- Validaciones reportadas: typecheck frontend aprobado, suite frontend completa 83/83, busqueda sin referencias obsoletas en `frontend/src` y `git diff --check -- frontend/src` aprobado. Sin QA visual.
