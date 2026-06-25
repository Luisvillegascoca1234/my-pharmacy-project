# Ticket 05 - Wire analysis navigation route titles and access states

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 04
- Blocks: 06

## Description

Conectar las nuevas paginas de analisis con rutas, titulos y permisos visibles. El objetivo es que reportes, exportaciones y auditoria dejen de depender de placeholders y que la navegacion comun refleje el alcance administrativo real del cierre posterior a venta.

## Scope

- Registro de paginas reales en el mapa de rutas de la aplicacion.
- Titulos de ruta para `/reports`, `/exports` y `/audit`.
- Reconciliacion de labels/descripciones de navegacion con el alcance V1 del PRD.
- Estados de acceso bloqueado para roles no autorizados usando el guard existente.
- Revisión de rutas administrativas para no afectar facturas ni devoluciones ya implementadas.

## Out Of Scope

- Reestructurar todo el sidebar o layout principal.
- Cambiar roles base o permisos backend.
- Crear nuevas rutas fuera de las superficies `reports`, `exports` y `audit`.

## Acceptance Criteria

- `/reports` y `/exports` apuntan a paginas reales para `admin` y `superadmin`.
- `/audit` apunta a pagina real solo para `superadmin`.
- Los titulos de ruta coinciden con el lenguaje operativo usado en navegacion.
- `seller` no ve entradas administrativas de analisis y obtiene pagina de acceso no autorizado si intenta abrirlas directamente.
- No se rompen las rutas existentes de facturas, devoluciones, caja, inventario ni POS.
