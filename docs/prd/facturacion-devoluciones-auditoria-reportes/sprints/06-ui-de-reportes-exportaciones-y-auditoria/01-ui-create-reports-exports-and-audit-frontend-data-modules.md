# Ticket 01 - Create reports exports and audit frontend data modules

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 02

## Description

Crear los modulos frontend portables para reportes, exportaciones CSV y auditoria. Estos modulos deben encapsular transporte, tipos, facades, hooks de datos, stores y mapeo de errores esperados para que las paginas consuman una interfaz estable sin llamar clientes HTTP directamente.

## Scope

- Modulo de reportes para ventas diarias, valuacion de inventario y productos proximos a vencer.
- Modulo de exportaciones para CSV de ventas y movimientos de inventario con filtros de fecha.
- Modulo de auditoria para listado paginado, filtros y detalle de metadata.
- Reutilizacion de contratos compartidos existentes cuando representen la respuesta backend.
- Estados de carga, exito, vacio, error esperado y permisos insuficientes expuestos como datos.

## Out Of Scope

- Componentes, paginas, copy visible, estilos, iconos o rutas dentro de `frontend/src/modules`.
- Cambios en endpoints backend, contratos compartidos o reglas de dominio.
- Reportes BI avanzados, CSV por item vendido o auditoria de consultas visuales.

## Acceptance Criteria

- Los clientes de feature solo construyen endpoints, pasan `params` y devuelven `response.data`.
- Las facades normalizan parametros de fechas, paginacion y filtros sin mezclar copy de pantalla.
- Los hooks exponen acciones estables para cargar reportes, descargar CSV y consultar auditoria.
- Los stores separan `State`, `Actions`, `Selectors` y `Store`, con selectores estables y sin dependencias UI.
- Los modulos no contienen `.tsx`, carpetas `components`, imports de rutas, iconos, CSS, Tailwind ni textos visibles.
