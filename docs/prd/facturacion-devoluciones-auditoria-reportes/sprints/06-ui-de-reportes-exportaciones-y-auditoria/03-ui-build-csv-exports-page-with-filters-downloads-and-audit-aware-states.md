# Ticket 03 - Build CSV exports page with filters downloads and audit-aware states

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Construir la pagina de exportaciones CSV para descargar ventas y movimientos de inventario con filtros operativos. La UI debe dejar claro que las descargas son extracciones sensibles auditadas, sin auditar consultas visuales de reportes.

## Scope

- Ruta `/exports` reemplazando el placeholder actual.
- Controles de rango de fecha para `sales.csv` e `inventory-movements.csv`.
- Descarga de CSV usando los endpoints de exportacion existentes y nombre de archivo estable.
- Estados de descarga por archivo, error esperado, permiso insuficiente y resultado exitoso.
- Mensajeria visible sobre separador punto y coma, fechas ISO y registro de auditoria de descarga.

## Out Of Scope

- Crear nuevos formatos de exportacion.
- Exportacion por item vendido en archivo separado.
- Cambiar separador CSV, columnas backend o reglas de auditoria.
- Persistir historial local de descargas.

## Acceptance Criteria

- `admin` y `superadmin` pueden descargar CSV de ventas y movimientos desde `/exports`.
- Cada descarga respeta filtros de fecha y mantiene retroalimentacion independiente de carga/exito/error.
- La UI comunica que el CSV usa separador `;` y fechas ISO para compatibilidad regional.
- Errores esperados de permisos, rango invalido o sesion vencida se muestran sin romper la pantalla.
- La pagina consume el modulo de exportaciones y no construye requests HTTP inline.
