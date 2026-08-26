# Actualización del showcase en Mac mini

Esta guía actualiza el código e imágenes de un stack coherente ya desplegado con el proyecto fijo `pharmacy-showcase`. La base es descartable y no se respalda, pero una actualización ordinaria conserva el volumen exacto `pharmacy-showcase-postgres-data`. No ejecuta seeds.

## 1. Verificar el estado existente

Desde `/Users/gordex-mac-mini/Projects/my-pharmacy-project`:

```bash
git branch --show-current
git rev-parse HEAD
git status --short
docker context show
docker info --format '{{.OSType}}/{{.Architecture}}'
docker ps -a --filter label=com.docker.compose.project=pharmacy-showcase
docker volume inspect pharmacy-showcase-postgres-data
docker network inspect pharmacy-showcase-network
```

Se requiere:

- rama `deploy/prueba-ui-ux-mac-mini`;
- worktree limpio;
- contexto `desktop-linux` y motor `linux/arm64`;
- exactamente el stack esperado, sin servicios ajenos bajo el proyecto;
- volumen y red con los nombres exactos;
- `deploy/.env` con modo `0600` e ignorado por Git;
- `deploy/secrets` con modo `0700` y `deploy/secrets/tunnel-token` con modo `0600`, ambos fuera de Git.

Comprobar permisos e ignore sin leer los secretos:

```bash
stat -f '%Lp %N' deploy/.env deploy/secrets deploy/secrets/tunnel-token
git check-ignore -q deploy/.env
git check-ignore -q deploy/secrets/tunnel-token
```

Detenerse ante cualquier diferencia. No reconstruir automáticamente un stack parcial.

Guardar la revisión candidata:

```bash
export SHOWCASE_COMMIT="$(git rev-parse HEAD)"
export SHOWCASE_IMAGE_TAG="$(git rev-parse --short=12 HEAD)"
```

## 2. Capturar el estado anterior

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps
docker inspect pharmacy-showcase-backend-1 pharmacy-showcase-frontend-1 pharmacy-showcase-docs-1 --format '{{.Name}} {{.Config.Image}} {{.Image}} {{.State.Health.Status}} {{.RestartCount}}'
docker volume inspect pharmacy-showcase-postgres-data --format '{{.Name}} {{.Mountpoint}}'
curl --fail --silent --show-error https://farmacia-demo.gordex.dev/api/health
curl --fail --silent --show-error --output /dev/null https://farmacia-docs.gordex.dev/
export PREVIOUS_BACKEND_IMAGE="$(docker inspect pharmacy-showcase-backend-1 --format '{{.Config.Image}}')"
case "$PREVIOUS_BACKEND_IMAGE" in pharmacy-showcase-backend:*) ;; *) exit 1 ;; esac
export PREVIOUS_IMAGE_TAG="${PREVIOUS_BACKEND_IMAGE#pharmacy-showcase-backend:}"
test -n "$PREVIOUS_IMAGE_TAG"
```

Registrar los tags e IDs de imagen anteriores. `PREVIOUS_IMAGE_TAG` conserva el tag anterior para una recuperación de aplicación compatible. No hay rollback de datos porque no existen backups ni una migración inversa certificada.

## 3. Construir y certificar las imágenes candidatas

El release existente permanece activo durante la construcción:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build backend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build frontend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml build docs
docker image inspect "pharmacy-showcase-backend:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
docker image inspect "pharmacy-showcase-frontend:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
docker image inspect "pharmacy-showcase-docs:$SHOWCASE_IMAGE_TAG" --format '{{.Os}}/{{.Architecture}}'
```

Cada imagen debe ser `linux/arm64`.

Inmediatamente antes de migrar:

```bash
test "$(git rev-parse HEAD)" = "$SHOWCASE_COMMIT"
test -z "$(git status --porcelain)"
```

## 4. Migrar y recrear la aplicación

Cerrar primero el acceso público y detener los procesos de aplicación que podrían escribir en la base. PostgreSQL y su volumen permanecen activos:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml stop cloudflared frontend docs backend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps postgres backend docs frontend cloudflared
```

La migración es hacia adelante y se ejecuta sin respaldo por decisión explícita para este showcase descartable:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml --profile init run --rm migrate
```

No ejecutar `seed-operational` ni `seed-realistic` durante una actualización ordinaria.

Recrear los servicios de aplicación con el nuevo tag sin tocar PostgreSQL ni el volumen:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d --no-deps --force-recreate backend docs
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d --no-deps --force-recreate frontend
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps postgres backend docs frontend
```

Esperar que PostgreSQL, backend, docs y frontend estén `healthy`. Solo entonces recrear y reabrir el túnel:

```bash
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d --no-deps --force-recreate cloudflared
SHOWCASE_IMAGE_TAG="$SHOWCASE_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml ps cloudflared
```

## 5. Comprobaciones posteriores

```bash
curl --fail --silent --show-error https://farmacia-demo.gordex.dev/api/health
curl --fail --silent --show-error --output /dev/null https://farmacia-demo.gordex.dev/
curl --fail --silent --show-error --output /dev/null https://farmacia-docs.gordex.dev/
docker inspect pharmacy-showcase-backend-1 pharmacy-showcase-frontend-1 pharmacy-showcase-docs-1 --format '{{.Name}} {{.Config.Image}} {{.Image}} {{.State.Health.Status}} {{.RestartCount}}'
docker volume inspect pharmacy-showcase-postgres-data --format '{{.Name}} {{.Mountpoint}}'
```

Confirmar que el volumen conserva la misma identidad y que los tags de los tres servicios corresponden a `$SHOWCASE_IMAGE_TAG`.

## Fallo y recuperación

- Si falla la construcción o una verificación previa a la migración, no recrear servicios; el release existente sigue activo.
- Si falla un servicio tras recrearlo y la migración fue compatible, restaurar las tres imágenes con `SHOWCASE_IMAGE_TAG="$PREVIOUS_IMAGE_TAG" docker compose --env-file deploy/.env -f deploy/compose.yml up -d --no-deps --force-recreate backend docs frontend`. Esperar sus healthchecks antes de ejecutar el mismo comando para `cloudflared`.
- Si la migración deja los datos incompatibles, no intentar revertirla en el mismo volumen. El entorno es descartable: detener el stack, destruir explícitamente el volumen con la guía de teardown y repetir el primer despliegue.
- No ejecutar seeds como mecanismo de reparación sobre una base que se quiera conservar.
