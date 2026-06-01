# Ticket 05 - Wire Cash POS Navigation Session Reset And Route Titles

- Status: DONE
- Category: INFRA
- Parent PRD: [PRD.md](../../PRD.md)
- Depends on: none
- Blocks: 06

## Description

Ajustar la integracion de navegacion y sesion para que las entradas de Caja y Punto de venta abran pantallas reales, respeten permisos visibles y limpien estado transitorio cuando cambia la sesion del usuario.

## Scope

- Rutas de Caja y Punto de venta conectadas a sus pantallas reales.
- Titulos, descripcion de navegacion y seleccion activa coherentes con mostrador farmaceutico.
- Reset de carrito, busqueda, cobro y comprobante al cerrar sesion o cambiar usuario.
- Manejo de acceso visible para seller, admin y superadmin segun alcance del PRD.
- Estados iniciales que no dependan de placeholders.

## Out Of Scope

- Nuevas secciones administrativas.
- Vista de supervision de cajas ajenas.
- Permisos backend nuevos.
- Redisenar navegacion general no relacionada.
- QA manual o recorrido con navegador.

## Acceptance Criteria

- Las entradas de Caja y Punto de venta navegan a pantallas funcionales.
- La seleccion activa y titulos coinciden con la ruta abierta.
- El estado transitorio del POS no se conserva entre usuarios.
- Los roles esperados pueden acceder a las pantallas segun el alcance aprobado.
- Las pantallas dejan de mostrar placeholders genericos.
