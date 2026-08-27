# Primer despliegue del showcase en Mac mini

Este procedimiento levanta una instancia pública, sintética y descartable durante un periodo corto. Usa el proyecto Compose fijo `pharmacy-showcase`, la red `pharmacy-showcase-network` y el volumen exclusivo `pharmacy-showcase-postgres-data`. No publica puertos del host y no crea respaldos.

Los hostnames ya están asociados en Cloudflare al túnel `famacia-billy`:

- `farmacia-demo.gordex.dev` para la aplicación y `/api`;
- `farmacia-docs.gordex.dev` para la documentación pública.

El túnel remoto debe dirigir ambos hostnames a `http://caddy:80`.

## Límites del showcase

- Solo se admiten datos ficticios.
- Las credenciales demo creadas por el seed operativo se conservan sin cambios.
- El scheduler predictivo permanece deshabilitado; el recálculo se inicia manualmente desde la aplicación.
- La base puede eliminarse y reconstruirse. No existe recuperación ni respaldo.
- El seed operativo elimina el contenido de la base. Solo debe ejecutarse en el primer despliegue sobre el volumen nuevo y exclusivo.

## Contrato de las imágenes

El Compose asume estos archivos y comportamientos:

- `deploy/Dockerfile.backend`: produce una imagen ARM64 con `/app/backend` como directorio de trabajo, Prisma, el workspace y los artefactos JavaScript compilados del backend. Debe incluir `/app/backend/dist/prisma/seed.js` y `/app/backend/dist/prisma/realistic-seed.js`; su comando predeterminado inicia el backend en el puerto `4000` sin descargar herramientas al arrancar.
- `deploy/Dockerfile.frontend`: compila `VITE_API_URL=/api` y sirve el frontend con Caddy en el puerto `80`. Su Caddyfile enruta `/api/*` a `backend:4000`, sirve el frontend para `farmacia-demo.gordex.dev` y hace proxy de `farmacia-docs.gordex.dev` a `docs:3001`.
- `deploy/Dockerfile.docs`: inicia Next.js en `0.0.0.0:3001` y contiene Node.js para su healthcheck.
- La imagen frontend basada en Caddy incluye el `wget` de BusyBox usado por su healthcheck.

Si alguno de estos contratos cambia, se debe ajustar `deploy/compose.yml` antes del despliegue.

## 1. Verificar el checkout

Desde la raíz del repositorio:

```bash
pwd
git branch --show-current
git rev-parse HEAD
git status --short
```

La ruta debe ser `/Users/gordex-mac-mini/Projects/my-pharmacy-project`, la rama debe ser `deploy/prueba-ui-ux-mac-mini` y `git status --short` no debe devolver nada. No continuar con cambios locales.

Guardar la revisión de esta sesión:

```bash
export SHOWCASE_COMMIT="$(git rev-parse HEAD)"
export SHOWCASE_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
```

## 2. Verificar Docker

```bash
docker context show
docker info --format '{{.OSType}}/{{.Architecture}}'
docker version
```

Se requiere el contexto `desktop-linux` y el motor `linux/arm64`.

Este procedimiento es solo para un primer despliegue. Confirmar que no existe estado anterior:

```bash
docker ps -a --filter label=com.docker.compose.project=pharmacy-showcase
docker volume inspect pharmacy-showcase-postgres-data
docker network inspect pharmacy-showcase-network
```

Los dos `inspect` deben indicar que el recurso no existe y el listado de contenedores debe estar vacío. Si aparece cualquier recurso, detenerse: usar la guía de actualización o autorizar explícitamente la destrucción descrita en la guía de teardown.

## 3. Preparar configuración local

Crear `deploy/.env` a partir de `deploy/.env.example`, mantener los valores internos del showcase y restringir sus permisos:

```bash
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
git check-ignore -q deploy/.env
```

El último comando debe finalizar correctamente. No guardar tokens dentro de `.env`.

Crear el archivo local del token sin imprimirlo ni introducirlo en el historial del shell:

```bash
mkdir -p deploy/secrets
chmod 700 deploy/secrets
touch deploy/secrets/tunnel-token
chmod 600 deploy/secrets/tunnel-token
git check-ignore -q deploy/secrets/tunnel-token
```

Editar `deploy/secrets/tunnel-token` localmente y pegar solo el token del túnel `famacia-billy`. El último `git check-ignore` debe finalizar correctamente antes de continuar. No mostrar el archivo en terminal, logs ni chat.

## 4. Construir las imágenes localmente

Mantener el tag exportado durante todo el procedimiento:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build backend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build frontend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build docs
```

Verificar que las tres imágenes sean ARM64:

```bash
docker image inspect "pharmacy-showcase-backend:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
docker image inspect "pharmacy-showcase-frontend:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
docker image inspect "pharmacy-showcase-docs:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
```

Cada resultado debe ser `linux/arm64`.

Antes de crear estado, reconfirmar el checkout:

```bash
test "$(git rev-parse HEAD)" = "$SHOWCASE_COMMIT"
test -z "$(git status --porcelain)"
```

Ambos comandos deben finalizar correctamente.

## 5. Inicializar la base descartable

Iniciar únicamente PostgreSQL y esperar a que aparezca `healthy`:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d postgres
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps postgres
```

Ejecutar los servicios one-shot en este orden estricto:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml --profile init run --rm migrate
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml --profile init run --rm seed-operational
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml --profile init run --rm seed-realistic
```

Cada comando debe finalizar con código cero. `seed-realistic` carga dos años de operación farmacéutica reproducible con `--as-of=2026-08-27` y `--seed=20260826` y, antes de terminar, ejecuta el cálculo inicial de planificación sobre esa historia. Al abrir **Qué comprar**, los pronósticos y sus detalles ya deben estar disponibles; **Recalcular ahora** queda reservado para actualizaciones posteriores.

No volver a ejecutar `seed-operational` en una base que se quiera conservar: su comportamiento es destructivo.

## 6. Levantar y comprobar los servicios locales

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d backend docs frontend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps postgres backend docs frontend
```

Esperar hasta que los cuatro servicios aparezcan `healthy`. Revisar únicamente logs acotados si alguno falla:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml logs --tail=100 backend docs frontend
```

Los logs no deben incluir secretos.

## 7. Abrir el túnel y comprobar los endpoints públicos

Solo después de la salud local:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d cloudflared
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps cloudflared
```

Comprobar sin autenticación de Cloudflare Access:

```bash
curl --fail --silent --show-error https://farmacia-demo.gordex.dev/api/health
curl --fail --silent --show-error --output /dev/null https://farmacia-demo.gordex.dev/
curl --fail --silent --show-error --output /dev/null https://farmacia-docs.gordex.dev/
```

El despliegue termina cuando PostgreSQL, backend, docs y frontend están saludables, `cloudflared` permanece en ejecución y los tres checks públicos responden correctamente.

## Datos de acceso demo

El seed operativo actual crea cuentas con contraseña `admin`, entre ellas:

- `admin@admin.com` como Superadmin;
- `admin@farmacia.local` como administrador;
- `vendedor@farmacia.local` como vendedor.

Estas credenciales solo son aceptables porque el entorno es un showcase público de datos ficticios y vida corta.
