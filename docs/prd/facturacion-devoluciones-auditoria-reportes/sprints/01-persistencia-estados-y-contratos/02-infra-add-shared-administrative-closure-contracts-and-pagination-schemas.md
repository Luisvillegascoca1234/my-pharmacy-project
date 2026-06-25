# Ticket 02 - Add shared administrative closure contracts and pagination schemas

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 03

## Description

Crear los contratos compartidos que usaran backend y frontend para facturas preparadas, devoluciones totales, auditoria consultable, reportes operativos y exportaciones CSV. Los contratos deben fijar nombres, filtros, paginacion, payloads y envelopes antes de implementar servicios o pantallas.

## Scope

- Definir schemas y tipos para preparar factura desde venta elegible, cancelar factura con motivo y listar facturas por estado, venta, correlativo y fecha.
- Definir schemas y tipos para ventas devolvibles, registro de devolucion total, errores de elegibilidad y listado paginado de devoluciones.
- Definir filtros y respuestas de auditoria para `superadmin`, incluyendo metadata completa y paginacion.
- Definir contratos de reportes para ventas diarias, valuacion de inventario por producto/lote y proximos vencimientos con `days` por defecto.
- Definir contratos de exportacion CSV para ventas y movimientos de inventario con filtros de fecha y separador punto y coma.
- Exportar los nuevos contratos desde la superficie compartida publica sin copy visible de UI.

## Out Of Scope

- Formularios, labels, mensajes visibles, iconos, rutas o componentes de interfaz.
- Consultas reales, calculos de reportes o generacion de archivos CSV.
- Reglas de permisos ejecutables y auditoria de descargas.
- Documentacion operativa para usuarios finales y evidencia academica final.

## Acceptance Criteria

- Los contratos comparten paginacion y filtros coherentes con los listados administrativos existentes.
- Los motivos de cancelacion de factura y devolucion total validan el rango de 5 a 500 caracteres.
- Los defaults de facturacion incluyen `customerNit` como `0` y `customerBusinessName` como `Consumidor final` cuando no se informan datos fiscales.
- Los reportes expresan rangos diarios compatibles con `America/La_Paz` y no auditan consultas visuales.
- Los contratos CSV reflejan una fila por venta o una fila por movimiento, fechas ISO y separador punto y coma.
- Los tipos exportados quedan listos para que los sprints backend y UI no redefinan formas de datos.
