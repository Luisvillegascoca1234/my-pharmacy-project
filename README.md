# POS farmacéutico

Aplicación para la operación de una farmacia de una sola sucursal: catálogo farmacéutico, compras, inventario por lote, dispensación FEFO, ventas POS, caja, comprobantes internos, devoluciones, auditoría, reportes y planificación de stock.

> Los datos incluidos para desarrollo y demostración son ficticios. No son válidos para uso sanitario, clínico ni regulatorio.

## Requisitos

- Windows con PowerShell.
- Node.js 22.
- pnpm 9.15.4.
- Docker Desktop con Docker Compose.

## Inicio rápido

Desde PowerShell, en la raíz del proyecto:

```powershell
Copy-Item .env.example .env
corepack enable
pnpm install
pnpm dev
```

`pnpm dev` realiza el flujo completo:

1. Levanta PostgreSQL con Docker Compose.
2. Espera hasta que la base de datos acepte conexiones.
3. Genera el cliente de Prisma.
4. Aplica las migraciones pendientes.
5. Ejecuta el seed operativo de desarrollo.
6. Levanta backend, aplicación web y documentación.

> **Advertencia:** el seed operativo reinicia los datos transaccionales de desarrollo. No ejecutes `pnpm dev`, `pnpm dev:prepare` ni el seed contra una base con información que necesites conservar.

## Direcciones locales

| Servicio | Dirección |
| --- | --- |
| Aplicación | <http://localhost:5173> |
| API | <http://localhost:4000/api> |
| Swagger | <http://localhost:4000/api/docs> |
| Estado de la API | <http://localhost:4000/api/health> |
| Documentación funcional | <http://localhost:3001> |

## Usuarios de desarrollo

Todos usan la contraseña `admin`.

| Rol | Correo |
| --- | --- |
| Superadmin | `admin@admin.com` |
| Admin | `admin@farmacia.local` |
| Vendedor | `vendedor@farmacia.local` |

## Comandos de ejecución

| Comando | Uso |
| --- | --- |
| `pnpm dev` | Prepara la base, ejecuta el seed operativo y levanta todo el proyecto. |
| `pnpm dev:services` | Levanta únicamente PostgreSQL y espera a que esté disponible. |
| `pnpm dev:prepare` | Genera Prisma, aplica migraciones y ejecuta el seed operativo. |
| `pnpm dev:apps` | Levanta backend, aplicación web y documentación sin preparar la base. |
| `pnpm --filter @pharmacy-pos/backend seed:stock-planning-prediction -- --as-of=2026-07-23 --seed=20260723` | Agrega historia sintética persistente para probar el motor predictivo. |
| `pnpm --filter @pharmacy-pos/backend db:reset:prediction -- --confirm-reset --as-of=2026-07-23 --seed=20260723` | Reconstruye toda la base y la deja preparada para probar predicción y análisis. |
| `pnpm build` | Compila todos los paquetes y aplicaciones. |
| `pnpm typecheck` | Comprueba los tipos TypeScript de todo el proyecto. |

Para detener las aplicaciones, presiona `Ctrl+C`. PostgreSQL seguirá activo en Docker. Para detenerlo:

```powershell
docker compose stop postgres
```

## Seeds y datos de demostración

### Seed operativo de desarrollo

Con PostgreSQL activo y las migraciones aplicadas:

```powershell
pnpm --filter @pharmacy-pos/backend prisma:seed
```

Este seed reinicia los datos operativos generales y crea:

- los roles institucionales `superadmin`, `admin` y `seller`;
- los tres usuarios de desarrollo;
- unidades y presentaciones farmacéuticas;
- una categoría de analgésicos y antipiréticos;
- un proveedor ficticio;
- Paracetamol 500 mg;
- una compra recibida;
- un lote vigente con 100 unidades;
- el movimiento de ingreso y su evidencia de auditoría.

Para regenerar Prisma, migrar y ejecutar ese seed en una sola operación:

```powershell
pnpm dev:prepare
```

### Seed realista para demostraciones

Cuando necesites presentar el sistema con una farmacia que ya tiene historia operativa, ejecuta:

```powershell
pnpm --filter @pharmacy-pos/backend seed:demo -- --as-of=2026-08-19 --seed=20260819
```

> **Advertencia:** este comando reconstruye primero los datos operativos. Úsalo solamente en desarrollo o sobre una base aislada de demostración.

La carga es determinista y crea un escenario proporcional de una farmacia de una sola sucursal:

- 50 usuarios: 42 activos, 5 inactivos y 3 bloqueados; los activos participan en ventas, caja, compras y recepciones según su rol;
- 15 categorías, 14 proveedores y 250 productos farmacéuticos;
- dos años de turnos de caja y actividad comercial;
- compras recibidas, en borrador y canceladas;
- tres ciclos de reposición con lotes, vencimientos y costos variables;
- más de cinco mil ventas en efectivo con consumos FEFO;
- anulaciones operativas, devoluciones totales y reversas al lote original;
- facturas preparadas internas, separadas de la facturación fiscal SIAT;
- productos agotados, con stock bajo y lotes próximos a vencer;
- carritos activos, vencidos, descartados y convertidos;
- cierres de caja conformes y diferencias menores de arqueo;
- evidencia de auditoría para operaciones representativas.

La fecha `--as-of` permite mover todo el escenario a la fecha de la presentación. La opción `--seed` conserva exactamente la misma distribución de ventas, importes, productos y turnos entre ejecuciones.

### Seed persistente para predicción y análisis

Este seed agrega historia comercial sintética sobre una base que ya fue preparada con el seed operativo:

```powershell
pnpm --filter @pharmacy-pos/backend seed:stock-planning-prediction -- --as-of=2026-07-23 --seed=20260723
```

Parámetros obligatorios:

| Parámetro | Descripción |
| --- | --- |
| `--as-of=YYYY-MM-DD` | Fecha de referencia. La historia termina el día anterior para evitar información futura. |
| `--seed=<entero>` | Semilla determinista que permite reproducir exactamente la misma historia. |

La carga crea siete productos farmacéuticos ficticios con patrones:

- estable;
- semanal;
- intermitente;
- creciente;
- sin demanda;
- con quiebres de stock y demanda censurada;
- con brote atípico.

También persiste aproximadamente seis meses de compras recibidas, lotes, ventas confirmadas, pagos, consumos FEFO, movimientos de inventario y snapshots diarios. La carga valida que el libro de movimientos coincida con el stock disponible.

El seed no crea pronósticos ni ejecuciones precalculadas. Deja el motor automático desactivado para que la predicción sea generada por el motor real mediante **Recalcular ahora**. Si ya existen productos con prefijo `PRED-`, el comando se detiene para evitar duplicar la historia.

> Usa este seed únicamente en desarrollo o en una base aislada de demostración. Aunque no borra los datos generales, agrega una cantidad importante de historia sintética y no está destinado a información productiva.

### Reconstrucción completa para probar predicción

Este es el recorrido recomendado cuando no necesitas conservar ningún dato:

```powershell
pnpm dev:services
pnpm --filter @pharmacy-pos/backend db:reset:prediction -- --confirm-reset --as-of=2026-07-23 --seed=20260723
pnpm dev:apps
```

El ejemplo usa el 23 de julio de 2026 como fecha de cálculo. Cambia `--as-of` por la fecha local desde la que quieras ejecutar el pronóstico; la historia siempre finalizará el día anterior.

El comando `db:reset:prediction`:

1. elimina todos los datos y reconstruye el esquema configurado;
2. aplica nuevamente todas las migraciones;
3. ejecuta el seed operativo general;
4. carga la historia sintética de predicción;
5. deja las aplicaciones listas para iniciar.

La bandera `--confirm-reset` es obligatoria porque la operación es destructiva. El comando está bloqueado cuando `NODE_ENV=production`.

> Después de preparar la base predictiva usa `pnpm dev:apps`, no `pnpm dev`: el segundo volvería a ejecutar el seed operativo general y alteraría la historia recién cargada.

### Generador sintético de planificación de stock

El proyecto también dispone de un generador no persistente para inspeccionar los patrones de demanda como JSON:

```powershell
pnpm --filter @pharmacy-pos/backend synthetic:stock-planning --profile=small --seed=20260723 --replace --output=../.scratch/stock-planning-small.json
```

Parámetros disponibles:

| Parámetro | Valores | Descripción |
| --- | --- | --- |
| `--profile` | `small`, `standard`, `stress` | Genera 25 productos por 6 meses, 250 por 24 meses o 2.500 por 24 meses. |
| `--seed` | Entero seguro | Hace reproducible la serie sintética. El valor predeterminado es `20260723`. |
| `--output` | Ruta de archivo | Guarda un manifiesto JSON con demanda latente, demanda observada y censura. |
| `--replace` | Bandera | Autoriza la generación cuando la base no está vacía. |

Los escenarios cubren demanda estable, semanal, intermitente, creciente, sin demanda, quiebre de stock y brote atípico.

> Este generador no es el seed predictivo persistente. No crea productos, ventas, movimientos, snapshots ni pronósticos en PostgreSQL; el resumen final informa `predictionsCreated: 0`. `--replace` solo supera la protección de ejecución y no reemplaza datos. La generación está bloqueada en producción.

## Probar la planificación y la predicción

### Flujo disponible con el seed operativo

1. Ejecuta `pnpm dev`.
2. Ingresa como `admin@admin.com`.
3. Abre <http://localhost:5173/stock-planning>.
4. Revisa el producto sembrado y su referencia de reposición.
5. Usa **Recalcular ahora** para solicitar una ejecución manual.

Este recorrido prueba correctamente:

- arranque en frío;
- captura diaria de inventario;
- referencia configurada según stock mínimo y stock utilizable;
- gobierno del motor;
- ejecución manual e historial;
- recomendación consultiva sin modificación automática del inventario.

No debe interpretarse como una predicción estadística: el seed operativo no aporta las 12 semanas mínimas de historia comercial. La aplicación debe mostrar **Sin historial** y conservar la referencia configurada.

### Predicción operativa con historia

Para que el motor emita una predicción operativa se necesitan, como mínimo:

- 12 semanas de historia comercial válida;
- 12 días con demanda observada;
- ventas confirmadas y disponibilidad suficientes para construir la serie;
- una ejecución manual o programada del motor.

Para probarla de extremo a extremo:

1. Ejecuta la reconstrucción completa con `db:reset:prediction`.
2. Inicia las aplicaciones con `pnpm dev:apps`.
3. Ingresa como `admin@admin.com`.
4. Abre <http://localhost:5173/stock-planning>.
5. Selecciona **Recalcular ahora**.
6. Revisa madurez, confianza, modelo, error, sesgo, banda predictiva, meta de inventario y recomendación.
7. Compara los siete productos `PRED-` para observar los distintos patrones.

La carga termina sin pronósticos (`forecasts: 0`) por diseño. Los pronósticos que aparecen después del recálculo son producidos por el motor real a partir de la historia persistida.

## Probar reportes y análisis de datos

Después de iniciar el entorno con `pnpm dev` o con el recorrido predictivo `db:reset:prediction` + `pnpm dev:apps`, ingresa como Admin o Superadmin.

### Reportes operativos

Abre <http://localhost:5173/reports>.

Con el seed operativo puedes revisar inmediatamente:

- valuación del inventario disponible por producto y lote;
- productos próximos a vencer;
- cantidades disponibles, costo unitario base y valor del lote.

Con el seed predictivo también puedes revisar seis meses de ventas sintéticas y comparar su evolución diaria. Las anulaciones y devoluciones se reflejan en los importes netos según su flujo operativo.

### Exportaciones analíticas

Abre <http://localhost:5173/exports>.

La aplicación ofrece:

- ventas POS en CSV;
- movimientos de inventario en CSV;
- serie temporal de planificación en Parquet;
- resultados predictivos en Parquet.

Las exportaciones CSV usan UTF-8, separador de punto y coma y fechas ISO. Después de ejecutar el seed predictivo y **Recalcular ahora**, las descargas Parquet permiten analizar la serie temporal y los resultados calculados por el motor.

### Auditoría

El Superadmin puede revisar las acciones sensibles en <http://localhost:5173/audit>. Las exportaciones, ejecuciones de planificación y operaciones administrativas generan evidencia trazable cuando corresponde.

## Preparación manual de la base

Si no deseas usar el flujo completo:

```powershell
pnpm dev:services
pnpm --filter @pharmacy-pos/backend prisma:generate
pnpm --filter @pharmacy-pos/backend prisma:migrate
pnpm --filter @pharmacy-pos/backend prisma:seed
pnpm dev:apps
```

## Variables de entorno

Copia `.env.example` como `.env` para desarrollo local. Los valores principales son:

| Variable | Valor local predeterminado | Uso |
| --- | --- | --- |
| `DATABASE_URL` | `postgresql://postgres:postgres@localhost:5432/pharmacy_pos?schema=public` | Conexión a PostgreSQL. |
| `PORT` | `4000` | Puerto de la API. |
| `FRONTEND_URL` | `http://localhost:5173` | Origen permitido para la aplicación. |
| `VITE_API_URL` | `http://localhost:4000/api` | Dirección de la API consumida por el cliente. |
| `JWT_SECRET` | Secreto exclusivo de desarrollo | Firma de sesiones JWT. |
| `JWT_EXPIRES_IN` | `8h` | Vigencia de la sesión. |

No reutilices el secreto ni las credenciales de desarrollo en producción.

> **Limitación auditada:** la configuración de la raíz sirve como referencia, pero actualmente no todos los procesos cargan automáticamente ese `.env`. Los valores predeterminados permiten ejecutar el proyecto sin cambios. Si necesitas personalizarlos, defínelos en la sesión de PowerShell antes de `pnpm dev`, por ejemplo: `$env:PORT="4100"`.

## Solución de problemas

### El puerto 5432 está ocupado

Detén el PostgreSQL local que usa ese puerto o cambia el mapeo de Docker y `DATABASE_URL` de forma consistente.

### Docker Desktop no está iniciado

Abre Docker Desktop y espera a que el motor esté listo antes de ejecutar `pnpm dev`.

### La base quedó en un estado inesperado

Si no necesitas conservar sus datos, vuelve a ejecutar:

```powershell
pnpm dev:prepare
```

Recuerda que este comando aplica migraciones y reinicia los datos operativos mediante el seed.

### La planificación muestra “Sin historial”

Es el comportamiento esperado cuando solo se ejecutó el seed operativo. La referencia de reposición no es una predicción. Para cargar historia comercial reproducible, usa:

```powershell
pnpm --filter @pharmacy-pos/backend db:reset:prediction -- --confirm-reset --as-of=2026-07-23 --seed=20260723
```

Después inicia las aplicaciones, ingresa como Superadmin y selecciona **Recalcular ahora**.
