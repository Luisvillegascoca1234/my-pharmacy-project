# 01 - Fundacion tecnica y contratos compartidos

## Objetivo

Levantar la base tecnica para que los siguientes chunks puedan implementarse como tracer bullets reales. Este chunk no busca cubrir dominio profundo; busca que backend, frontend, base de datos y contratos compartidos se comuniquen correctamente.

## Alcance

- Estructura `backend/`, `frontend/` y `packages/shared`.
- Backend con Express, TypeScript, Prisma y PostgreSQL.
- Frontend con Vite, React, Tailwind CSS y shadcn/ui.
- Schemas Zod compartidos desde `packages/shared`.
- Endpoint de salud del backend.
- Pantalla inicial del frontend que consume el endpoint de salud.
- Configuracion de variables de entorno.

## Backend

Crear estructura base:

```text
backend/
  prisma/
    schema.prisma
    seed.ts
  src/
    app.ts
    server.ts
    config/
      env.ts
    infrastructure/
      prisma/
        prisma.client.ts
    common/
      errors/
      middleware/
      http/
    modules/
      health/
        health.controller.ts
        health.routes.ts
        health.service.ts
    routes/
      index.ts
```

El tracer bullet backend debe exponer:

- `GET /api/health`
- Respuesta con version, estado y timestamp.
- Validacion de entorno al iniciar.

## Frontend

Crear estructura base:

```text
frontend/src/
  api/
  layouts/
  modules/
    health/
      api/
      hooks/
      index.ts
  pages/
  routes/
  ui/
```

El tracer bullet frontend debe mostrar:

- Shell basico de aplicacion.
- Estado del backend obtenido desde `GET /api/health`.
- Estado loading y error.

## Packages

Crear:

```text
packages/shared/src/
  schemas/
  types/
  constants/
  index.ts
```

Contratos iniciales:

- `HealthStatusSchema`
- `ApiErrorSchema`
- constantes de roles base: `superadmin`, `admin`, `seller`

## Verificacion

- Backend inicia sin errores.
- Frontend inicia sin errores.
- Frontend muestra estado real del backend.
- Typecheck pasa en backend, frontend y packages.

## Fuera de alcance

- Login real.
- Roles persistidos.
- CRUDs de dominio.
- Docker obligatorio.
- Diseno final del dashboard.
