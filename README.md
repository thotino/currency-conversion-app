# CURRENCY CONVERSION APP

Service de change compose d'une API metier, d'un faux partenaire bancaire et d'une interface web. Le parcours principal est le suivant : l'API cree une cotation, reserve cette cotation pour une conversion, soumet ensuite la conversion au provider, puis met a jour son etat a partir des webhooks recus.

## Architecture

Le depot contient trois applications independantes. Il n'y a pas de `package.json` a la racine.

- `api/` : API NestJS sur le port `3000`, avec PostgreSQL, Sequelize et les repositories metier.
- `provider/` : faux partenaire bancaire Express sur le port `4000`. Il simule des latences, erreurs et webhooks.
- `web/` : SPA React/Vite sur le port `5173`, qui consomme l'API.
- `docker-compose.yml` : demarre PostgreSQL, l'API, le provider et le frontend.

### Routes de l'API

Toutes les routes ci-dessous sont exposees par l'API sur `http://localhost:3000`.

| Methode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Verifie que PostgreSQL repond et retourne `{ "status": "ok", "database": "up" }`. |
| `POST` | `/quotes` | Cree une cotation valable 30 secondes. Corps : `{ "amount": 100, "sourceCurrency": "EUR", "targetCurrency": "USD" }`. |
| `POST` | `/conversions` | Cree une conversion a partir d'une cotation. Corps : `{ "userId": "...", "quoteId": "..." }`. Requiert le header `X-Idempotency-Key`. |
| `GET` | `/conversions?userId=...` | Liste les conversions d'un utilisateur. |
| `GET` | `/balances?userId=...` | Calcule le solde a la demande a partir des conversions terminees. |
| `POST` | `/webhooks/provider` | Recoit et persiste les evenements emis par le provider. |

La validation globale de l'API transforme les DTO, conserve uniquement les proprietes autorisees et rejette les proprietes inconnues.

### Routes du provider

Le provider est disponible sur `http://localhost:4000`.

| Methode | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Health check du provider. |
| `GET` | `/v1/rates` | Retourne les taux EUR/USD/GBP. |
| `POST` | `/v1/conversions` | Accepte une conversion et retourne normalement `202` avec un `providerRef`. |
| `GET` | `/v1/conversions/:providerRef` | Consulte une conversion conservee par le provider. |

Une soumission est asynchrone : le provider programme des evenements `conversion.accepted`, `conversion.executed` ou `conversion.rejected` vers `/webhooks/provider`. Le header `X-Test-Scenario` permet de forcer `happy_path`, `reject`, `early_webhook`, `out_of_order`, `duplicate_webhook` ou `error_after_accept` lors d'un appel direct au provider. Le provider utilise `PROVIDER_SEED=424242` par defaut pour rendre les comportements reproductibles.

### Workers

Les workers sont lances automatiquement par `api/src/main.ts` apres le demarrage HTTP :

- `ConversionsWorker` s'execute toutes les 60 secondes et soumet au provider les conversions au statut `CREATED`.
- `WebhooksWorker` s'execute toutes les 10 secondes, recupere les evenements en attente et met a jour la conversion (`accepted`, `executed` ou `rejected`).

Les timers ne lancent pas de traitement immediat au demarrage. Pour tester un parcours complet, attendre le passage des deux workers ou appeler directement les composants dans les tests.

### Stores et persistance

- PostgreSQL stocke les clients, cotations, conversions et evenements webhook.
- Sequelize mappe les modeles metier de l'API ; les repositories se trouvent dans les modules `quotes`, `conversions` et `webhooks`.
- Le provider stocke ses conversions dans une `Map` en memoire (`provider/src/store.ts`). Ces donnees, ainsi que son compteur de references, sont perdues a chaque redemarrage.
- PostgreSQL est conserve dans le volume Docker `db-data`.

## Developpement local

### Prerequis

- Node.js 22 (les Dockerfiles utilisent `node:22-alpine`).
- npm.
- PostgreSQL 16 si l'API est lancee hors Docker.
- Docker et Docker Compose pour le mode recommande.

Installer les dependances dans chaque application :

```bash
cd api && npm install
cd ../provider && npm install
cd ../web && npm install
```

Versions principales declarees dans les `package.json` : NestJS `10.4.x`, TypeScript API `5.9.x`, Jest `29.7.x`, Sequelize `6.37.x`, Express `4.21.x`, React `18.3.x`, Vite `5.4.x` et PostgreSQL `16-alpine`.

### Configuration de l'API hors Docker

L'API exige `DATABASE_URL` et `PROVIDER_BASE_URL` :

```bash
export DATABASE_URL='postgres://fintech:fintech@localhost:5432/conversions?sslmode=disable'
export PROVIDER_BASE_URL='http://localhost:4000'
export PORT=3000
```

Le provider accepte `PORT` (defaut `4000`), `PROVIDER_SEED` (defaut `424242`) et `WEBHOOK_URL` (defaut `http://api:3000/webhooks/provider`). Le frontend utilise `VITE_API_URL` (defaut Docker : `http://localhost:3000`).

### Migrations

Les migrations SQL sont dans `api/migrations/`, dans cet ordre : clients, quotes, conversions, puis events. Avec une base locale disponible :

```bash
cd api
DATABASE_URL="$DATABASE_URL" npm run migrate:up
DATABASE_URL="$DATABASE_URL" npm run migrate:down
npm run migrate:create -- add-my-change
```

Une migration doit etre ajoutee pour toute modification de schema. Ne pas modifier une migration deja appliquee sur un environnement partage. `docker compose up` execute automatiquement `npm run migrate:up` avant le demarrage de l'API.

## Docker Compose

Le mode Docker est le plus simple pour demarrer tout le parcours :

```bash
docker compose up --build
```

Services disponibles : PostgreSQL `localhost:5432`, API `localhost:3000`, provider `localhost:4000`, web `localhost:5173` et debugger Node de l'API `localhost:9229`.

Commandes utiles :

```bash
docker compose logs -f api
docker compose logs -f provider
docker compose ps
docker compose exec api npm test
docker compose exec api npm run test:e2e
docker compose down
```

Le volume PostgreSQL est persistant. Pour repartir d'une base vide, supprimer explicitement le volume :

```bash
docker compose down -v
```

### Debug de l'API

En Compose, l'API demarre avec `start:dev:inspect` et expose le port `9229`. Dans VS Code, attacher un debugger Node au port `9229`, avec le projet local `api/` comme `localRoot` et `/app` comme `remoteRoot`. Les logs se consultent avec `docker compose logs -f api`.

Pour debugger hors Docker :

```bash
cd api
npm run start:dev:inspect
```

Verifier d'abord que PostgreSQL et le provider sont accessibles avec `GET /health`.

## Tests

Depuis `api/` :

```bash
npm test                 # tests unitaires et smoke
npm run test:e2e         # tests dont le nom se termine par e2e-spec.ts
```

Les tests API se trouvent principalement dans `api/src/**/__tests__/` et `api/src/health/`. Les tests E2E actuels ciblent surtout les controleurs avec des services simules ; ils ne remplacent pas un test d'integration complet PostgreSQL/provider/workers.

Depuis la racine, le test d'idempotence cree une cotation puis envoie dix requetes concurrentes avec la meme cle :

```bash
node test-idempotence.js
./test-idempotence.sh
```

Variables utiles : `API_URL` et `USER_ID`. Par exemple :

```bash
API_URL=http://localhost:3000 USER_ID=00000000-0000-0000-0000-000000000001 node test-idempotence.js
```

## Lint et formatage

Les scripts ESLint et Prettier sont actuellement configures uniquement pour l'API :

```bash
cd api
npm run lint       # verifie le code
npm run prettier   # reformate les fichiers TypeScript avec --write
```

Le provider et le frontend proposent des scripts `build`, mais pas de scripts lint ou formatage dedies :

```bash
cd ../provider && npm run build
cd ../web && npm run build
```

Avant une PR, lancer au minimum les migrations sur une base de developpement, les tests API, le lint et les builds des trois applications.
