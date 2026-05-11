# Ticket 07 - Run Manual QA On Affected Areas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 06
- Blocks: 08

## Description

Ejecutar QA manual enfocado sobre la superficie afectada por sprint Backend De Compras E Inventario cuando el desarrollador lo solicite. Como este sprint no entrega UI, la verificacion principal es API/backend; Playwright MCP solo aplica si durante el cierre se decide validar una superficie browser-based relacionada, como documentacion API renderizada o una pantalla existente que consuma compras.

Este ticket no cierra el epic completo; no debe cambiar `epic.md` a `- Status: DONE`.

## Scope

- requests autenticados contra `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `PATCH /api/purchases/:id`, `POST /api/purchases/:id/receive` y `POST /api/purchases/:id/cancel`
- casos de autorizacion para `superadmin`, `admin` y `seller`
- flujo feliz: crear borrador, editar borrador, recibir compra inventariable/no inventariable y anular compra recibida intacta
- casos negativos: item vacio, proveedor inactivo, producto inactivo, unidad no configurada, duplicado equivalente, vencimiento invalido, compra no encontrada, estado no editable, capa consumida y motivo faltante
- verificacion de auditoria, capas y movimientos si hay acceso directo a datos de prueba

## Out Of Scope

- iniciar el dev server
- QA exploratorio amplio fuera del sprint
- frontend de compras, stores Zustand, navegacion o pantallas
- validar SIAT, pagos, cuentas por pagar, stock visual o kardex visual
- actualizar `epic.md` a `DONE`

## Acceptance Criteria

- QA manual se ejecuta solo si fue solicitado explicitamente para este sprint.
- Los endpoints de compras se ejercitan paso a paso con usuario autorizado.
- `seller` queda bloqueado para lectura/gestion de compras segun la decision del PRD.
- La recepcion valida que se creen capas y movimientos esperados sin inventario parcial.
- La anulacion de compra recibida intacta genera movimientos inversos y cancela las capas.
- No aparecen respuestas 5xx en flujos validos ni errores inesperados fuera de casos negativos previstos.
- Playwright MCP se usa explicitamente solo si hay una superficie browser-based dentro de la verificacion solicitada.
- Bloqueadores como datos seed faltantes, problemas de autenticacion o rutas inaccesibles se documentan con paso exacto, metodo y URL.

## Manual QA Result - 2026-05-11

QA manual fue solicitado explicitamente por el operador para este sprint. Se intento iniciar la verificacion API enfocada, sin Playwright MCP porque el alcance no requiere superficie browser-based.

Bloqueador encontrado:

- Paso: autenticar usuario seed superadmin antes de ejercitar compras.
- Metodo y URL: `POST http://localhost:4000/api/auth/login`
- Payload: `{"email":"admin@admin.com","password":"admin"}`
- Resultado: conexion rechazada por el host local; PowerShell reporto `No se puede establecer una conexión ya que el equipo de destino denegó expresamente dicha conexión. (localhost:4000)`.
- Impacto: no fue posible continuar con `GET /api/purchases`, `GET /api/purchases/:id`, `POST /api/purchases`, `PATCH /api/purchases/:id`, `POST /api/purchases/:id/receive`, `POST /api/purchases/:id/cancel`, casos de autorizacion `superadmin`/`admin`/`seller`, flujo feliz, casos negativos, ni verificacion directa de auditoria, capas o movimientos.

Validaciones auxiliares:

- Se verifico que no hay listener activo en los puertos locales esperados `4000`, `5173`, `3000` o `4173`.
- No se inicio el dev server porque esta fuera del alcance del ticket.
