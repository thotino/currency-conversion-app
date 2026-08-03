# Keewe — Cas pratique

Squelette de départ. Le sujet du cas est fourni séparément par mail.

## Prérequis

- Docker (avec Docker Compose v2)

Aucune installation locale de Node ou de PostgreSQL n'est nécessaire.

## Démarrage

```bash
docker compose up
```

Cette commande construit et démarre l'ensemble. Les migrations de la base sont
appliquées automatiquement au démarrage de l'API. Le rechargement à chaud est
actif sur l'API et sur le front : une modification dans `api/` ou `web/` est
prise en compte sans redémarrage.

## Services

| Service              | URL                   |
| -------------------- | --------------------- |
| Front (React + Vite) | http://localhost:5173 |
| API (NestJS)         | http://localhost:3000 |
| Partenaire bancaire  | http://localhost:4000 |

Vérification rapide : `curl http://localhost:3000/health`.

La base PostgreSQL est exposée sur `localhost:5432`
(`postgres://keewe:keewe@localhost:5432/keewe`).

## Tests

```bash
docker compose exec api npm test
```

## Migrations

Les migrations sont des fichiers SQL dans `api/migrations/`, appliquées au
démarrage de l'API.

Créer une migration :

```bash
docker compose exec api npm run migrate:create -- nom_de_la_migration
```

Appliquer / annuler manuellement :

```bash
docker compose exec api npm run migrate:up
docker compose exec api npm run migrate:down
```

## Partenaire bancaire

Le service `provider` simule un partenaire bancaire externe. Son intégration est
documentée dans [`provider/API.md`](provider/API.md).

## Structure

Toute la structure du projet peut être réorganisée librement.
