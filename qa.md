# Smoke test manual de la app

Objetivo: validar rápidamente que los flujos principales abren, cargan datos, guardan registros básicos y mantienen navegación estable desde el navegador.

## Datos de acceso

- App operativa: `http://localhost:5173`
- Documentación: `http://localhost:3001`
- Usuario semilla: `admin@admin.com`
- Contraseña semilla: `admin`

> Si tu Vite levantó otro puerto, usa el que aparece en la terminal del dev server.

## Criterio general de aprobación

Marca el smoke test como aprobado si:

- Puedes iniciar sesión y cerrar sesión sin errores.
- El dashboard indica que el servidor está en línea.
- Las secciones principales cargan sin pantalla en blanco.
- Puedes crear al menos un proveedor, una categoría/unidad, un producto y una compra en borrador.
- Los filtros y búsquedas no rompen las listas.
- La documentación abre, busca contenido y muestra páginas internas.

## 1. Acceso y sesión

1. Abre `http://localhost:5173`.
2. Confirma que si no hay sesión activa te redirige a `/login`.
3. En la pantalla **Iniciar sesión**, verifica que estén precargados:
   - Correo electrónico: `admin@admin.com`
   - Contraseña: `admin`
4. Presiona **Iniciar sesión**.
5. Resultado esperado: entras al **Dashboard operativo**.
6. Abre `/logout` desde la barra de dirección.
7. Resultado esperado: la sesión se cierra y vuelves al flujo de login.
8. Inicia sesión nuevamente para continuar el smoke test.

## 2. Dashboard

1. Entra a **Dashboard**.
2. Verifica que se muestren las tarjetas:
   - Ventas de hoy
   - Stock crítico
   - Compras abiertas
   - Facturas observadas
3. En **Preparación del sistema**, confirma que aparezca **Servidor en línea**.
4. Verifica que se muestren las alertas operativas iniciales.
5. Resultado esperado: no hay alerta de servidor no disponible ni pantalla de carga permanente.

## 3. Navegación lateral y módulos iniciales

1. Recorre el menú lateral principal.
2. Abre estas secciones y confirma que cada una carga título, descripción y contenido:
   - Punto de venta
   - Caja
   - Devoluciones y anulaciones
   - Alertas
   - Lotes y stock
   - Movimientos
   - Ajustes manuales
   - Facturas SIAT
   - Configuración SIAT
   - Reportes
   - Exportaciones CSV
   - Auditoría
   - Roles y permisos
   - Configuración
3. Resultado esperado: cada ruta debe renderizar una pantalla informativa, sin errores de navegación.

## 4. Unidades y categorías

1. Abre **Unidades y conversiones**.
2. Verifica que la tabla de unidades semilla cargue registros como `Unidad`, `Caja` o `Blister`.
3. En **Nueva unidad**, registra:
   - Nombre: `Smoke unidad`
   - Abreviatura: `SMK`
4. Presiona **Guardar unidad**.
5. Resultado esperado: la unidad aparece en la tabla.
6. En **Nueva categoría**, registra:
   - Nombre: `Smoke categoria`
   - Descripción: `Categoria creada durante smoke test`
7. Presiona **Guardar categoría**.
8. Resultado esperado: la categoría aparece en la tabla.

## 5. Proveedores

1. Abre **Proveedores**.
2. Si no hay registros, confirma que se muestre el estado vacío con opción para crear proveedor.
3. Presiona **Nuevo proveedor**.
4. Registra:
   - Razón social: `Smoke Farma SRL`
   - NIT: `123456789`
   - Teléfono: `70000000`
   - Contacto: `QA Manual`
   - Dirección: `Av. Smoke Test 123`
5. Presiona **Guardar**.
6. Resultado esperado: vuelves a la lista de proveedores y ves `Smoke Farma SRL`.
7. Usa el buscador con `Smoke`.
8. Resultado esperado: la lista filtra el proveedor creado.
9. Cambia el filtro de estado entre **Todos**, **Activo** e **Inactivo**.
10. Resultado esperado: el filtro responde sin romper la tabla.
11. Abre **Ver** o **Editar** sobre el proveedor creado.
12. Cambia el teléfono a `71111111` y guarda.
13. Resultado esperado: vuelves a la lista y el proveedor sigue visible.

## 6. Productos

1. Abre **Productos**.
2. Confirma que se vean las métricas **Total**, **Activos** y **Con receta**.
3. En **Nuevo producto**, usa estos datos:
   - Código de barras: `SMOKE-001`
   - Nombre comercial: `Paracetamol Smoke 500 mg`
   - Principio activo: `Paracetamol`
   - Categoría: `Smoke categoria` o cualquier categoría disponible
   - Unidad base: `Unidad` o cualquier unidad disponible
   - Proveedor: `Smoke Farma SRL` o cualquier proveedor disponible
   - Tipo: `Medicamento`
   - Precio de venta: `12.50`
4. Deja activas las opciones inventariables por defecto.
5. Presiona **Guardar**.
6. Resultado esperado: el producto aparece en la lista.
7. Busca `Paracetamol Smoke`.
8. Resultado esperado: la búsqueda filtra el producto.
9. Presiona **Editar** en el producto.
10. Cambia el precio de venta a `13.00` y guarda.
11. Resultado esperado: el producto queda actualizado en la tabla.
12. Selecciona nuevamente el producto y revisa **Conversiones**.
13. Agrega una conversión solo si hay otra unidad disponible, guarda con **Actualizar**.
14. Resultado esperado: no se muestra error de conversión.

## 7. Compras

Antes de esta sección debe existir al menos un proveedor activo y un producto activo asociado a ese proveedor.

1. Abre **Compras**.
2. Presiona **Nueva compra**.
3. En **Encabezado**, selecciona:
   - Proveedor: `Smoke Farma SRL`
   - Fecha comercial: la fecha actual
   - Notas: `Compra creada durante smoke test`
4. En **Items**, presiona **Agregar item** si no hay fila disponible.
5. En la primera fila selecciona:
   - Producto: `Paracetamol Smoke 500 mg`
   - Unidad: la unidad disponible
   - Cantidad: `10`
   - Costo unitario: `8.50`
   - Lote: `LOT-SMOKE-001`
   - Vencimiento: una fecha futura, por ejemplo `2027-12-31`
6. Verifica que el **Total visual** se actualice.
7. Presiona **Guardar borrador**.
8. Resultado esperado: quedas en el detalle de la compra y el estado es **Borrador**.
9. Vuelve a **Compras**.
10. Busca `Smoke` o filtra por proveedor.
11. Resultado esperado: la compra aparece en la lista.
12. Abre la compra con **Ver**.
13. Presiona **Recibir** o **Recibir compra**.
14. En el diálogo, agrega la nota `Recepcion smoke test` y confirma.
15. Resultado esperado: la compra pasa a estado **Recibida** y queda en modo solo lectura.

## 8. Usuarios

1. Abre **Usuarios**.
2. Verifica que carguen las métricas **Total**, **Activos** y **Bloqueados**.
3. Crea un usuario de prueba:
   - Nombre completo: `Usuario Smoke`
   - Correo electrónico: `smoke.user@example.com`
   - Rol: cualquier rol disponible
   - Contraseña inicial: `smoke123`
4. Presiona **Crear usuario**.
5. Resultado esperado: el usuario aparece en la lista.
6. Usa el buscador con `smoke.user`.
7. Resultado esperado: la lista filtra el usuario.
8. Presiona **Editar**, cambia el nombre a `Usuario Smoke Editado` y guarda.
9. Presiona **Resetear**, define `smoke456` en ambos campos y guarda.
10. Cambia el estado con **Bloquear**, **Activar** o **Desactivar**.
11. Resultado esperado: el badge de estado cambia sin error.

## 9. Validaciones rápidas negativas

1. En **Proveedores > Nuevo proveedor**, intenta guardar con razón social de un solo carácter.
2. Resultado esperado: aparece validación y no se guarda.
3. En **Productos**, intenta guardar un producto sin nombre comercial.
4. Resultado esperado: el navegador o la interfaz impide guardar.
5. En **Compras > Nueva compra**, intenta guardar sin proveedor o sin item completo.
6. Resultado esperado: se muestra una alerta de corrección y no se crea una compra inválida.
7. En **Usuarios**, intenta crear un usuario con contraseña menor a 6 caracteres.
8. Resultado esperado: el formulario impide guardar o muestra error.

## 10. Responsive básico

1. En el navegador, cambia a una vista angosta tipo móvil.
2. Revisa:
   - Login
   - Dashboard
   - Productos
   - Proveedores
   - Compras
3. Resultado esperado: no hay textos montados, controles inaccesibles ni tablas que rompan la navegación general.

## 11. Documentación

1. Abre `http://localhost:3001`.
2. Verifica que cargue la portada de documentación.
3. Entra a la sección de documentación.
4. Abre estas páginas:
   - Primeros pasos
   - Conceptos
   - Catálogo farmacéutico
   - Unidades y conversiones
   - Proveedores
   - Compras recibidas
   - Ventas POS
   - Inventario por lote
   - Facturación SIAT
   - Glosario farmacéutico
5. Usa la búsqueda con términos:
   - `lote`
   - `FEFO`
   - `SIAT`
   - `proveedor`
6. Resultado esperado: la búsqueda devuelve resultados relevantes y las páginas internas renderizan contenido.

## 12. Flujo normal de trabajo de punta a punta

Este recorrido simula una jornada operativa normal en una farmacia: preparar catálogos, abastecer inventario, vender, controlar caja, revisar alertas y cerrar con reportes.

### 12.1 Preparación administrativa inicial

1. Inicia sesión como `admin@admin.com`.
2. Abre **Usuarios** y confirma que exista al menos un usuario activo con rol operativo.
3. Abre **Unidades y conversiones**.
4. Confirma que existan unidades farmacéuticas base como `Unidad`, `Caja`, `Blister`, `Frasco` o equivalentes.
5. Crea las unidades o categorías faltantes para operar medicamentos e insumos.
6. Resultado esperado: la farmacia queda con catálogos mínimos para registrar productos.

### 12.2 Alta de proveedor

1. Abre **Proveedores**.
2. Registra o valida un proveedor activo con razón social, NIT, contacto, teléfono y dirección.
3. Busca el proveedor por razón social o NIT.
4. Abre el detalle del proveedor y confirma que el estado sea **Activo**.
5. Resultado esperado: el proveedor queda disponible para compras y recepciones.

### 12.3 Alta de producto farmacéutico

1. Abre **Productos**.
2. Registra un producto con nombre comercial, principio activo, categoría, unidad base, proveedor, precio de venta y datos sanitarios disponibles.
3. Para medicamentos inventariables, deja activo:
   - Inventariable
   - Exige lote
   - Exige vencimiento
4. Guarda el producto.
5. Busca el producto por nombre comercial, principio activo o código de barras.
6. Si corresponde, configura conversiones de presentación, por ejemplo `Caja` hacia `Unidad` o `Blister` hacia `Comprimido`.
7. Resultado esperado: el producto queda listo para recibir stock por lote y vencimiento.

### 12.4 Registro de compra y recepción de inventario

1. Abre **Compras**.
2. Crea una **Nueva compra**.
3. Selecciona proveedor activo y fecha comercial.
4. Agrega productos asociados al proveedor.
5. Por cada producto inventariable registra cantidad, costo unitario, lote y fecha de vencimiento.
6. Guarda la compra como **Borrador**.
7. Revisa el detalle y confirma que el total visual sea correcto.
8. Presiona **Recibir compra**.
9. Agrega una nota de recepción y confirma.
10. Resultado esperado: la compra pasa a **Recibida** y queda en solo lectura.

### 12.5 Control de stock por lote

1. Abre **Lotes y stock**.
2. Busca el producto recibido.
3. Verifica lote, cantidad disponible, vencimiento, costo y estado operativo.
4. Resultado esperado: el stock recibido debería estar visible por lote para venta FEFO.
5. Estado actual: esta pantalla todavía es informativa; si no muestra lotes reales, registrar pendiente en `TODO.md`.

### 12.6 Venta normal en POS

1. Abre **Punto de venta**.
2. Busca el producto por nombre, código interno o código de barras.
3. Agrega el producto al carrito.
4. Confirma que el sistema seleccione lote disponible con criterio FEFO.
5. Ajusta cantidad.
6. Confirma precio, subtotal, total y forma de pago.
7. Finaliza la venta.
8. Resultado esperado: la venta queda registrada, el stock del lote disminuye y se genera comprobante o factura según corresponda.
9. Estado actual: esta pantalla todavía es informativa; registrar pendiente en `TODO.md`.

### 12.7 Caja y pagos

1. Abre **Caja**.
2. Inicia apertura de caja con monto inicial.
3. Revisa ingresos por ventas, pagos y diferencias.
4. Realiza cierre de caja.
5. Resultado esperado: caja cerrada con total esperado, total contado, diferencia y responsable.
6. Estado actual: esta pantalla todavía es informativa; registrar pendiente en `TODO.md`.

### 12.8 Facturación SIAT

1. Abre **Configuración SIAT**.
2. Verifica datos de punto de venta, actividad económica, CUIS, CUFD y parámetros de contingencia.
3. Abre **Facturas SIAT**.
4. Revisa estado de emisión, validación, observaciones, anulaciones y contingencias.
5. Resultado esperado: las ventas facturables deben reflejar estado fiscal y respuesta del SIN.
6. Estado actual: estas pantallas todavía son informativas; registrar pendiente en `TODO.md`.

### 12.9 Devoluciones, anulaciones y ajustes

1. Abre **Devoluciones y anulaciones**.
2. Busca una venta o documento fiscal.
3. Intenta registrar devolución o anulación con motivo obligatorio.
4. Abre **Ajustes manuales**.
5. Registra ajuste justificado sobre inventario si aplica.
6. Resultado esperado: cada operación conserva trazabilidad, motivo, usuario y efecto en stock/caja/facturación.
7. Estado actual: estas pantallas todavía son informativas; registrar pendiente en `TODO.md`.

### 12.10 Alertas, movimientos y auditoría

1. Abre **Alertas** y revisa vencimientos, stock bajo, caja abierta y observaciones SIAT.
2. Abre **Movimientos** y revisa entradas, salidas, ajustes, devoluciones y mermas.
3. Abre **Auditoría** y busca acciones sensibles por usuario, fecha y módulo.
4. Resultado esperado: debe existir trazabilidad operativa para control farmacéutico y administrativo.
5. Estado actual: estas pantallas todavía son informativas; registrar pendiente en `TODO.md`.

### 12.11 Reportes y cierre del día

1. Abre **Reportes**.
2. Revisa ventas del día, margen, rotación, vencimientos, compras y caja.
3. Abre **Exportaciones CSV**.
4. Genera exportaciones operativas con fechas ISO e IDs estables.
5. Resultado esperado: se puede cerrar la jornada con reportes y datos exportables.
6. Estado actual: estas pantallas todavía son informativas; registrar pendiente en `TODO.md`.

## 13. Cierre del smoke test

1. Vuelve a la app operativa.
2. Cierra sesión con `/logout`.
3. Resultado esperado: no puedes volver al dashboard sin autenticarte.
4. Registra el resultado final:
   - Aprobado
   - Aprobado con observaciones
   - Bloqueado

## Observaciones encontradas

Usa esta sección durante la ejecución manual:

| Fecha | Pantalla | Paso | Resultado esperado | Resultado obtenido | Severidad |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
