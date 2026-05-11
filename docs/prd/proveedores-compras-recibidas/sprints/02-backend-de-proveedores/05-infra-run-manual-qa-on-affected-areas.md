# Ticket 05 - Run Manual QA On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Ejecutar QA manual enfocado sobre la superficie afectada por sprint Backend De Proveedores cuando el desarrollador lo solicite. Como este sprint no entrega UI, la verificacion principal es API/backend; Playwright MCP solo aplica si durante el cierre se decide validar una superficie web relacionada, como documentacion API renderizada o una pantalla existente que consuma proveedores.

Este ticket no cierra el epic completo; no debe cambiar `epic.md` a `- Status: DONE`.

## Scope

- requests autenticados contra `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers` y `PATCH /api/suppliers/:id`
- casos de autorizacion para `superadmin`, `admin` y `seller`
- errores esperados: validacion `400`, no autenticado `401`, prohibido `403`, no encontrado `404` y NIT duplicado `409`
- verificacion de auditoria para creacion y actualizacion si hay acceso directo a datos de prueba

## Out Of Scope

- iniciar el dev server
- QA exploratorio amplio fuera del sprint
- validacion de compras, inventario, recepcion, anulacion o frontend futuro
- actualizar `epic.md` a `DONE`

## Acceptance Criteria

- QA manual se ejecuta solo si fue solicitado explicitamente para este sprint.
- Los endpoints de proveedores se ejercitan paso a paso con usuario autorizado.
- `seller` queda bloqueado para lectura/gestion de proveedores segun la decision del PRD.
- No aparecen respuestas 5xx en flujos validos ni errores inesperados fuera de los casos negativos previstos.
- Playwright MCP se usa explicitamente solo si hay una superficie browser-based dentro de la verificacion solicitada.
- Bloqueadores como datos seed faltantes, problemas de autenticacion o rutas inaccesibles se documentan con paso exacto, metodo y URL.

## Manual QA Result - 2026-05-11

QA manual fue solicitado explicitamente por el operador para este sprint. Se intento iniciar la verificacion API enfocada, sin Playwright MCP porque el alcance no requiere superficie browser-based.

Bloqueador encontrado:

- Paso: autenticar usuario seed superadmin antes de ejercitar proveedores.
- Metodo y URL: `POST http://localhost:4000/api/auth/login`
- Payload: `{"email":"admin@admin.com","password":"admin"}`
- Resultado: conexion rechazada por el host local; PowerShell reporto `No se puede establecer una conexión ya que el equipo de destino denegó expresamente dicha conexión. (localhost:4000)`.
- Impacto: no fue posible continuar con `GET /api/suppliers`, `GET /api/suppliers/:id`, `POST /api/suppliers`, `PATCH /api/suppliers/:id`, casos `401/403/404/409`, ni verificacion directa de auditoria.

Validaciones auxiliares:

- Se verifico que no hay listener activo en los puertos locales esperados `4000`, `5173`, `3000` o `4173`.
- No se inicio el dev server porque esta fuera del alcance del ticket.
