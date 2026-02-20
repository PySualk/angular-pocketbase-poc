# Quickstart: PocketBase Todo Showcase

**Prerequisites**: Docker, Docker Compose, Node.js 20+, npm 11+

---

## 1. Start PocketBase

```bash
docker compose up --build
```

PocketBase starts at `http://localhost:8080`. On first run the `todos` collection is created automatically via the migration in `pocketbase/pb_migrations/`.

**First run only**: Open `http://localhost:8080/_/` and create an admin account (required to access the Admin UI). The todo app itself requires no login.

---

## 2. Install Angular dependencies

```bash
npm install
```

---

## 3. Start the Angular dev server

```bash
npm start
```

App is available at `http://localhost:4200`.

---

## 4. Run tests

```bash
npm test
```

---

## Stopping

```bash
# Stop PocketBase (preserves data)
docker compose down

# Stop and wipe all data (clean slate)
docker compose down -v
```

---

## Inspecting the database

The PocketBase SQLite database is stored at `pocketbase/pb_data/data.db`. Open it with [DB Browser for SQLite](https://sqlitebrowser.org/) or any SQLite tool for direct inspection.

---

## Environment configuration

| File | Purpose |
|---|---|
| `src/environments/environment.ts` | Dev — points to `http://localhost:8080` |
| `src/environments/environment.prod.ts` | Prod — update `pocketbaseUrl` before deploying |

The Angular build swaps environment files automatically: `npm start` and `npm test` use the dev file; `npm run build` uses the prod file.
