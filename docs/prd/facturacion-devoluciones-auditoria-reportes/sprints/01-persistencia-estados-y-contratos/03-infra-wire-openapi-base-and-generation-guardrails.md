# Ticket 03 - Wire OpenAPI base and generation guardrails

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 02
- Blocks: 04

## Description

Preparar la documentacion OpenAPI inicial y los guardrails de generacion para que las rutas de facturacion preparada, devoluciones, auditoria, reportes y exportaciones queden nombradas con estabilidad antes de implementar comportamiento ejecutable.

## Scope

- Agregar tags, schemas base y rutas planificadas para facturas preparadas, devoluciones totales, auditoria consultable, reportes y exportaciones.
- Documentar estados, filtros, errores de elegibilidad y respuestas paginadas sin prometer integracion SIAT real.
- Incluir permisos esperados por rol: `admin` y `superadmin` para facturas, devoluciones, reportes y exportaciones; solo `superadmin` para auditoria.
- Registrar que las descargas CSV generan auditoria, mientras que la consulta visual de reportes no la genera.
- Dejar comandos o notas de generacion alineados con Prisma y contratos compartidos.

## Out Of Scope

- Implementar endpoints HTTP reales o montar rutas funcionales.
- Crear datos semilla, pantallas, navegacion o flujos de descarga.
- Ejecutar QA manual de navegador.
- Cerrar `epic.md` como `DONE`; el epic todavia conserva sprints backend, UI y cierre documental pendientes.

## Acceptance Criteria

- OpenAPI describe el alcance V1 con factura preparada interna y sin SIAT real.
- Los schemas OpenAPI usan los mismos estados y formas de datos definidos por los contratos compartidos.
- Los codigos de error esperados distinguen venta no facturable, factura activa que bloquea devolucion, venta ya devuelta, motivo invalido y permisos insuficientes.
- Los reportes documentados cubren ventas diarias, valuacion de inventario y productos proximos a vencer.
- Las exportaciones documentadas cubren `sales.csv` e `inventory-movements.csv` con filtros basicos.
- Las notas de generacion dejan claro que los servicios transaccionales se implementan en sprints posteriores.
