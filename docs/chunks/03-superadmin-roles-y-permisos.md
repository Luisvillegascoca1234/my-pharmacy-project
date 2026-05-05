# 03 - Superadmin roles y permisos

## Objetivo

Empezar el camino principal desde las facultades del superadmin. El resultado debe permitir ver, crear y modificar roles y permisos controlados, dejando lista la base de autorizacion del sistema.

## Alcance

- Catalogo de permisos del sistema.
- Roles base: superadmin, admin y seller.
- Seed inicial de permisos.
- Middleware `requirePermission`.
- CRUD administrativo de roles.
- Asignacion de permisos a roles.
- UI de superadmin para roles y permisos.
- Auditoria de cambios de roles.

## Backend

Modulo recomendado:

```text
backend/src/modules/roles/
  roles.controller.ts
  roles.routes.ts
  roles.service.ts
  roles.repository.ts
  roles.types.ts
```

Endpoints minimos:

- `GET /api/permissions`
- `GET /api/roles`
- `GET /api/roles/:id`
- `POST /api/roles`
- `PATCH /api/roles/:id`
- `PUT /api/roles/:id/permissions`

Reglas:

- Solo superadmin puede administrar roles.
- El rol `superadmin` no debe perder permisos criticos.
- No se debe eliminar fisicamente un rol con usuarios asociados.
- Cada cambio sensible genera auditoria.

## Frontend

Modulo recomendado:

```text
frontend/src/modules/roles/
  api/
  components/
  facades/
  hooks/
  schemas/
  store/
  index.ts
```

Pantallas:

- Lista de roles.
- Detalle de rol.
- Editor de permisos por grupos funcionales.

UX verificable:

- El superadmin ve permisos agrupados por modulo.
- Puede guardar cambios.
- Recibe errores claros si intenta una accion bloqueada.

## Contratos compartidos

Schemas:

- `PermissionSchema`
- `RoleSchema`
- `CreateRoleSchema`
- `UpdateRolePermissionsSchema`

## Verificacion

- Seed crea roles y permisos.
- Superadmin puede crear un rol operativo.
- Superadmin puede modificar permisos de `admin`.
- Usuario sin permiso recibe `403`.
- Auditoria registra antes y despues del cambio.

## Fuera de alcance

- Gestion completa de usuarios.
- Permisos por sucursal.
- Permisos temporales.
- Matriz visual avanzada de auditoria.
