# Ticket 06 - Clean Up Final Integration References

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: 01, 02, 05
- Blocks: 07

## Description

Limpiar referencias obsoletas, duplicacion de integracion, nombres temporales y documentacion desalineada expuestos por el cierre del epic, limitandose a las superficies tocadas por ventas POS, caja y pagos.

## Scope

- superficies de producto tocadas por el sprint
- referencias de navegacion, permisos, contratos y documentacion tocadas por el cierre
- notas temporales o deuda accidental introducida durante la integracion
- terminologia inconsistente entre POS, caja, ventas, pendientes y anulacion
- referencias que contradigan el alcance V1 aprobado

## Out Of Scope

- limpieza amplia fuera del alcance del sprint
- cambios funcionales nuevos
- refactors de fases posteriores
- facturacion SIAT, QR, tarjeta, credito o reportes
- reescritura amplia de tesis o documentacion no relacionada

## Acceptance Criteria

- no quedan referencias obsoletas evidentes en las superficies tocadas por el sprint
- la terminologia de caja, POS, pago efectivo, FEFO, pendientes y anulacion es coherente
- la documentacion de cierre no contradice el PRD ni el alcance V1
- cualquier deuda diferida queda documentada explicitamente con impacto y motivo
- no se agregan cambios funcionales nuevos durante la limpieza

## Implementation Notes

- Se inspeccionaron rutas reales, contratos compartidos y superficies frontend de caja, POS, pendientes, ventas/anulaciones y supervision para reconciliar disponibilidad ejecutable contra documentacion.
- Se limpiaron referencias obsoletas en la app de docs que todavia presentaban punto de venta y caja como modulos iniciales.
- Se ajusto la terminologia documental para pago efectivo V1, comprobante interno, caja abierta, FEFO, pendientes sin reserva ni precio congelado, anulacion controlada y limites fiscales.
- Nota historica posterior al Sprint 08: la deuda de cierre sobre carritos pendientes, anulacion de ventas y supervision administrativa completa quedo resuelta por el correctivo backend y su validacion tecnica. El cierre formal queda pendiente solo por reconciliacion y limpieza documental del Sprint 09.
- No se agregaron cambios funcionales.
