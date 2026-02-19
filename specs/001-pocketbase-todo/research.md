# Research: PocketBase Todo Showcase

**Branch**: `001-pocketbase-todo` | **Date**: 2026-02-19

---

## 1. PocketBase JS SDK

**Decision**: Install `pocketbase@^0.26.8` (latest stable as of 2026-02-19, compatible with PocketBase server 0.36.4).

**Rationale**: The npm package is named `pocketbase`. SDK 0.26.x is the current stable series and works with the server version pinned in the Dockerfile. The SDK and server use independent versioning — there is no strict minor-version pairing required.

**Alternatives considered**: Community wrappers — rejected (no added value for a minimal POC).

**CRUD API**:
```typescript
// List (newest first)
const result = await pb.collection('todos').getList(1, 200, { sort: '-created' });

// Create
await pb.collection('todos').create({ title: 'Buy milk', completed: false });

// Toggle
await pb.collection('todos').update(id, { completed: true });

// Delete
await pb.collection('todos').delete(id);
```

**Realtime**: `subscribe('*', callback)` opens a Server-Sent Events (SSE) connection. The promise resolves to an unsubscribe function. The callback fires outside Angular's zone but signal writes are zone-safe in Angular 21 — no `NgZone.run()` needed.

```typescript
const unsubscribe = await pb.collection('todos').subscribe('*', (event) => {
  // event.action: 'create' | 'update' | 'delete'
  // event.record: the full affected record
});
// Cleanup: unsubscribe();
```

---

## 2. Docker Topology

**Decision**: Run only PocketBase in Docker. Angular dev server runs on the host via `npm start`.

**Rationale**: Angular's HMR and file-watching require tight host filesystem integration. Docker volume mounts for `node_modules` cause known cross-platform performance issues. Angular (on host at `localhost:4200`) calls PocketBase via the host-mapped port `http://localhost:8080` — not the Docker internal service name.

**CORS**: PocketBase ships with permissive CORS defaults. For belt-and-suspenders, pass `--origins=http://localhost:4200` to the serve command via the Dockerfile CMD.

**Alternatives considered**: Running Angular in Docker — rejected (HMR friction). Angular proxy config — rejected (hides integration issues, disappears in production).

---

## 3. PocketBase Data Persistence

**Decision**: Switch from named volume to bind mount (`./pocketbase/pb_data:/pb/pb_data`) and add `pocketbase/pb_data/` to `.gitignore`.

**Rationale**: A bind mount makes the SQLite database directly inspectable on the host using tools like DB Browser for SQLite — valuable for a POC showcase. Data persists across `docker compose down` (lost only with `docker compose down -v`). The named volume (already present) is also correct, but the bind mount is more transparent for development.

**Alternatives considered**: Named volume (existing) — correct but opaque. In-container storage — data lost on restart, unacceptable.

---

## 4. Collection Bootstrapping

**Decision**: Use PocketBase JS migrations (`pb_migrations/1_create_todos.js`) committed to the repository and copied into the Docker image.

**Rationale**: Migrations run automatically on every `docker compose up`, in order, tracking applied state in the database. Any developer can run `docker compose up` and get a fully configured PocketBase instance with the `todos` collection ready. The Dockerfile already has a commented-out `COPY ./pb_migrations` line for exactly this purpose.

**Alternatives considered**: Manual Admin UI setup — not reproducible across developers. Seed scripts — require external orchestration (wait-for-it + curl) and add complexity. Pre-seeded `data.db` — binary file unfriendly to git diff.

---

## 5. Angular Environment Configuration

**Decision**: Use `src/environments/environment.ts` (dev) and `src/environments/environment.prod.ts` (prod) with `fileReplacements` in `angular.json`.

**Rationale**: Standard Angular mechanism for build-time environment config. The PocketBase URL is baked into the bundle at build time — appropriate for a SPA with no server-side runtime. Dev URL (`localhost:8080`) never appears in production bundles.

**Alternatives considered**: Runtime config via `assets/config.json` + `APP_INITIALIZER` — overkill for a POC. `.env` files — not supported via official Angular CLI APIs without additional plugins. Hardcoded URL — no dev/prod distinction possible.

---

## 6. Angular Service Pattern

**Decision**: Provide the PocketBase client via a `@Injectable({ providedIn: 'root' })` `PocketBaseService` class. A separate `TodoService` injects it and exposes `signal<Todo[]>` state plus async CRUD methods.

**Rationale**: A typed service class is simpler to stub in unit tests than a raw `InjectionToken<PocketBase>`. `providedIn: 'root'` gives a singleton (one SSE connection) with no registration ceremony in `app.config.ts`. Signal writes inside the SSE callback are zone-safe in Angular 21 without `NgZone.run()`.

**Alternatives considered**: `InjectionToken<PocketBase>` — harder to stub, no simpler to use. RxJS Observable wrapping `subscribe()` + `toSignal()` — adds complexity, contradicts the signals mandate in the project constitution.
