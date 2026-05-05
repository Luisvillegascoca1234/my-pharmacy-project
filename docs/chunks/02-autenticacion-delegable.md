# 02 - Autenticacion delegable

## Objetivo

Construir autenticacion completa y verificable para que el resto del sistema pueda proteger rutas por usuario y rol. Este chunk esta disenado para delegarse sin bloquear el avance del superadmin.

## Alcance

- Modelo de usuarios base.
- Login con email y password.
- Hash seguro de password.
- Token o cookie de sesion segun decision tecnica del proyecto.
- Middleware de autenticacion.
- Endpoint `me`.
- Logout si se usa cookie o sesion persistida.
- Auditoria minima de inicio de sesion exitoso y fallido.

## Backend

Modulo recomendado:

```text
backend/src/modules/auth/
  auth.controller.ts
  auth.routes.ts
  auth.service.ts
  auth.repository.ts
  auth.types.ts
```

Endpoints minimos:

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Responsabilidades:

- Controller valida input con Zod.
- Service verifica credenciales, estado activo y emite sesion/token.
- Repository busca usuario y rol con permisos necesarios.
- Middleware adjunta `authenticatedUser` al request.

## Base de datos

Modelos minimos:

- `User`
- `Role`
- `Permission`
- relacion entre roles y permisos
- `AuditLog` minimo para eventos de autenticacion

Campos sugeridos para `User`:

- `id`
- `email`
- `passwordHash`
- `fullName`
- `roleId`
- `status`
- `lastLoginAt`
- `createdAt`
- `updatedAt`

## Frontend

Modulo recomendado:

```text
frontend/src/modules/auth/
  api/
  hooks/
  store/
  schemas/
  types/
  index.ts
```

Pantallas o componentes:

- Login.
- Estado de sesion cargando.
- Redireccion si no hay sesion.
- Menu de usuario con logout.

## Contratos compartidos

Schemas en `packages/shared`:

- `LoginRequestSchema`
- `AuthenticatedUserSchema`
- `AuthSessionSchema`

## Verificacion

- Usuario superadmin seed puede iniciar sesion.
- Credenciales invalidas devuelven error controlado.
- `GET /api/auth/me` devuelve el usuario autenticado.
- Ruta protegida rechaza requests sin sesion.
- El frontend restaura sesion al refrescar.
- Auditoria registra login exitoso y fallido.

## Fuera de alcance

- Recuperacion de password.
- MFA.
- OAuth.
- Registro publico de usuarios.
- Politicas avanzadas de expiracion.
