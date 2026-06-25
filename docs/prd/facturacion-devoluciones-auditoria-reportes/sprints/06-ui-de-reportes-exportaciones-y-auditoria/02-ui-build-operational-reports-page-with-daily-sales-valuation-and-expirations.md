# Ticket 02 - Build operational reports page with daily sales valuation and expirations

- Status: DONE
- Category: UI
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01
- Blocks: 03

## Description

Construir la pagina de reportes operativos para que administracion consulte ventas diarias, valuacion de inventario disponible y productos proximos a vencer desde una sola superficie de analisis. La pagina debe usar los hooks del modulo de reportes y traducir estados de datos a UI clara.

## Scope

- Ruta `/reports` reemplazando el placeholder actual.
- Filtros de fecha para ventas diarias con corte operativo de Bolivia.
- Lectura de bruto, anulaciones, devoluciones, neto y conteos operativos.
- Valuacion de inventario por producto con detalle expandible por lote disponible, vencimiento y costo.
- Reporte de proximos vencimientos con parametro `days`, default 30 y control de horizonte.
- Estados de carga, vacio, error esperado, permiso insuficiente y recarga.

## Out Of Scope

- Graficos BI complejos, data warehouse o analitica predictiva.
- Exportar archivos desde la pagina de reportes.
- Cambiar calculos backend o incluir lotes agotados/cancelados en valuacion.

## Acceptance Criteria

- `admin` y `superadmin` pueden abrir `/reports`; `seller` recibe estado de acceso bloqueado por las rutas existentes.
- Ventas diarias muestran bruto, anulaciones, devoluciones, neto y cantidades sin confundir anulacion POS con devolucion administrativa.
- Valuacion muestra total general y detalle por lote expandible con cantidades y costo real de lote.
- Vencimientos permite cambiar el horizonte en dias y conserva default 30 cuando no hay entrada.
- La pagina no importa clientes HTTP de feature directamente; consume el hook/facade publico del modulo.
