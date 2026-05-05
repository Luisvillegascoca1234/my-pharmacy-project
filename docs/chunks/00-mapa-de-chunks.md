# Mapa de chunks con tracer bullets

Este mapa divide el sistema POS de farmacia en segmentos verificables. La idea es construir de punta a punta en rebanadas pequenas: contrato compartido, base de datos, backend por capas, frontend de modulo, permisos, auditoria minima y una prueba manual clara.

El orden prioriza que autenticacion pueda delegarse mientras el hilo principal avanza desde las facultades del superadmin.

## Criterio de tracer bullet

Cada chunk debe cerrar con una prueba demostrable:

- Un endpoint disponible o una pantalla navegable.
- Datos persistidos en PostgreSQL mediante Prisma.
- Validacion con Zod compartida cuando aplique.
- Permiso aplicado por rol.
- Evento de auditoria cuando la accion sea sensible.
- Un flujo manual repetible.

## Secuencia recomendada

1. `01-fundacion-tecnica-y-contratos.md`: base monorepo, shared schemas, backend Express, frontend Vite.
2. `02-autenticacion-delegable.md`: login, sesion, middleware y usuario actual.
3. `03-superadmin-roles-y-permisos.md`: permisos, roles y guardas de acceso.
4. `04-superadmin-usuarios.md`: gestion administrativa de usuarios.
5. `05-superadmin-configuracion-global.md`: parametros globales y configuracion SIAT inicial.
6. `06-catalogos-base-productos-unidades.md`: productos, categorias, unidades y conversiones.
7. `07-proveedores-y-compras-recibidas.md`: proveedores, compras y entrada de inventario.
8. `08-inventario-lotes-movimientos-alertas.md`: lotes, movimientos, FEFO visible y alertas.
9. `09-ventas-pos-caja-y-pagos.md`: venta pagada, caja simple y descuento FEFO.
10. `10-facturacion-devoluciones-auditoria-reportes.md`: facturacion preparada, anulaciones, devoluciones, reportes y CSV.

## Paralelizacion sugerida

- Delegar autenticacion desde el inicio usando `02-autenticacion-delegable.md`.
- Trabajar en paralelo el camino superadmin desde `03-superadmin-roles-y-permisos.md`.
- No avanzar a ventas hasta tener productos, unidades, lotes y movimientos estables.
- No mezclar SIAT real con ventas POS iniciales; primero dejar facturacion como modulo separado y estado controlado.

## Regla de avance

Un chunk esta terminado cuando se puede mostrar su flujo principal sin mocks de UI y sin saltarse la arquitectura:

- Frontend: `page -> module hook/facade -> api/store`.
- Backend: `route -> controller -> service -> repository -> Prisma`.
- Contratos: Zod en `packages/shared` cuando el dato cruza frontend/backend.
- Dominio: transacciones en services para operaciones que cambian inventario, caja, compras, ventas o facturacion.
