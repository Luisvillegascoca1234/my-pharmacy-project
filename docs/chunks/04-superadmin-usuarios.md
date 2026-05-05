# 04 - Superadmin usuarios

## Objetivo

Permitir que el superadmin administre usuarios del sistema con roles existentes. Este chunk conecta autenticacion, roles y auditoria en un flujo administrativo real.

## Alcance

- CRUD administrativo de usuarios.
- Asignacion de rol.
- Activar, desactivar y bloquear usuario.
- Reseteo administrativo de password.
- Busqueda y filtros basicos.
- Auditoria de creacion, cambios de rol, cambios de estado y reseteo de password.

## Backend

Modulo recomendado:

```text
backend/src/modules/users/
  users.controller.ts
  users.routes.ts
  users.service.ts
  users.repository.ts
  users.types.ts
```

Endpoints minimos:

- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/status`
- `POST /api/users/:id/reset-password`

Reglas:

- Solo superadmin gestiona usuarios en este chunk.
- Email debe ser unico.
- No se puede desactivar al ultimo superadmin activo.
- No se debe exponer `passwordHash`.
- Cambiar rol o estado debe registrar auditoria.

## Frontend

Modulo recomendado:

```text
frontend/src/modules/users/
  api/
  components/
  facades/
  hooks/
  schemas/
  store/
  index.ts
```

Pantallas:

- Lista de usuarios con filtros por rol y estado.
- Formulario crear/editar usuario.
- Acciones de estado.
- Modal de reseteo de password.

## Contratos compartidos

Schemas:

- `UserSchema`
- `CreateUserSchema`
- `UpdateUserSchema`
- `UpdateUserStatusSchema`
- `ResetUserPasswordSchema`

## Verificacion

- Superadmin crea un usuario admin.
- Superadmin crea un usuario seller.
- Usuario desactivado no puede iniciar sesion.
- No se puede desactivar al ultimo superadmin.
- Auditoria muestra cambios relevantes.

## Fuera de alcance

- Perfil editable por el propio usuario.
- Recuperacion por correo.
- Politicas avanzadas de password.
- Importacion masiva de usuarios.
