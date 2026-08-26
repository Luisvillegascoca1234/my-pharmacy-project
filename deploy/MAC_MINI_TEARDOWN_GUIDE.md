# Detención y destrucción del showcase

Esta guía usa nombres y servicios exactos del proyecto `pharmacy-showcase`. No elimina recursos de MatPres, Money Tracker ni otras aplicaciones del Mac mini. No usar patrones, globs ni comandos globales de limpieza.

Los comandos de esta guía no eliminan el túnel remoto `famacia-billy`, sus rutas DNS ni su token en Cloudflare. Esa eliminación se hace manualmente en Cloudflare al finalizar el showcase.

## Opción A: cerrar el acceso público sin detener la aplicación

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml stop cloudflared
```

Esto conserva todos los contenedores y datos. Como no hay puertos publicados en el host, el showcase deja de ser accesible desde Internet.

## Opción B: detener todo y conservar la base

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml stop cloudflared frontend docs backend postgres
```

Los contenedores, imágenes, red y el volumen `pharmacy-showcase-postgres-data` permanecen disponibles para reiniciar el stack.

Para reanudarlo:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml start postgres
docker compose --env-file deploy/.env -f deploy/compose.yml ps postgres
docker compose --env-file deploy/.env -f deploy/compose.yml start backend docs
docker compose --env-file deploy/.env -f deploy/compose.yml ps backend docs
docker compose --env-file deploy/.env -f deploy/compose.yml start frontend
docker compose --env-file deploy/.env -f deploy/compose.yml ps frontend
docker compose --env-file deploy/.env -f deploy/compose.yml start cloudflared
```

Esperar el estado `healthy` después de cada `ps`. El túnel se abre únicamente cuando PostgreSQL, backend, docs y frontend ya están saludables.

## Opción C: retirar contenedores y conservar la base

Primero detener los servicios y después retirar únicamente los contenedores del showcase:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml stop cloudflared frontend docs backend postgres
docker compose --env-file deploy/.env -f deploy/compose.yml rm -f cloudflared frontend docs backend postgres migrate seed-operational seed-demo seed-prediction
```

El volumen `pharmacy-showcase-postgres-data` no se elimina. La red puede permanecer hasta un despliegue posterior.

## Opción D: destrucción irreversible de la base descartable

Esta opción elimina los datos y solo debe ejecutarse con autorización explícita para destruir el showcase. No existe backup.

Resolver primero el inventario exacto:

```bash
docker ps -a --filter label=com.docker.compose.project=pharmacy-showcase
docker volume inspect pharmacy-showcase-postgres-data
docker network inspect pharmacy-showcase-network
```

Confirmar que todos los recursos pertenecen exclusivamente a este showcase. Luego detener y retirar solo sus servicios:

```bash
docker compose --env-file deploy/.env -f deploy/compose.yml stop cloudflared frontend docs backend postgres
docker compose --env-file deploy/.env -f deploy/compose.yml rm -f cloudflared frontend docs backend postgres migrate seed-operational seed-demo seed-prediction
```

La siguiente operación es irreversible y elimina únicamente el volumen exacto del showcase:

```bash
docker volume rm pharmacy-showcase-postgres-data
```

Después de comprobar que no quedan contenedores conectados, puede retirarse la red exacta:

```bash
docker network rm pharmacy-showcase-network
```

No eliminar imágenes automáticamente. Si se decide retirarlas después, inventariar y seleccionar cada tag exacto de `pharmacy-showcase-backend`, `pharmacy-showcase-frontend` y `pharmacy-showcase-docs` en una operación separada.

## Limpieza local del token

Una vez eliminado manualmente el túnel o revocado su token en Cloudflare, el archivo local puede borrarse de forma explícita:

```bash
rm deploy/secrets/tunnel-token
```

Esta acción no elimina `.env`, imágenes ni datos. No usar comandos globales de poda de Docker.
