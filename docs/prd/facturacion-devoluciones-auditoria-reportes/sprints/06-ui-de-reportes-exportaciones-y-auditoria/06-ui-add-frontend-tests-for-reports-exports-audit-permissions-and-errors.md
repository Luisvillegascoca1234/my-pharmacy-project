# Ticket 06 - Add frontend tests for reports exports audit permissions and errors

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 05
- Blocks: 08

## Description

Agregar pruebas automatizadas frontend para los modulos y estados criticos de reportes, exportaciones y auditoria. La cobertura debe priorizar contratos de datos, permisos, errores esperados, filtros, paginacion y descargas, sin depender de QA manual.

## Scope

- Pruebas de APIs/facades para parametros de reportes, exportaciones y auditoria.
- Pruebas de stores/selectores para estados de carga, exito, vacio, error y paginacion.
- Pruebas de hooks para permisos `admin`, `superadmin` y bloqueo de `seller`.
- Casos esperados de sesion invalida, permisos insuficientes, filtros invalidos y errores de descarga.
- Actualizacion de boundary tests para asegurar que modulos de datos no importan UI ni rutas.

## Out Of Scope

- Pruebas end-to-end con navegador.
- Capturas visuales o QA manual.
- Pruebas backend de calculo de reportes o generacion CSV.

## Acceptance Criteria

- Las facades construyen parametros correctos para fechas, `days`, paginacion y filtros.
- Los stores mantienen selectores estables y resetean estados al cambiar permisos o sesion.
- Los hooks bloquean operaciones no autorizadas sin llamar endpoints.
- Exportaciones cubren estado de descarga independiente para ventas y movimientos.
- Los tests de limites de modulo fallan si `frontend/src/modules` incorpora `.tsx`, UI, router, iconos, estilos o copy visible.
