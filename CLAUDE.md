# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Angular dev server
npm start                          # Dev server at http://localhost:4200 (hot reload)
npm run build                      # Production build to dist/
npm run watch                      # Dev build with watch mode
npm test                           # Run all unit tests with Vitest
ng test --include src/path/to/file.spec.ts  # Run a single spec file

# Code generation
ng generate component <name>       # Scaffold a new standalone component

# PocketBase backend
docker compose up --build          # Start PocketBase at http://localhost:8080
docker compose down                # Stop PocketBase (preserves data)
docker compose down -v             # Stop PocketBase and wipe all data (clean slate)
```

There is no lint command configured.

## Project Structure

```
angular-pocketbase-poc/
├── src/
│   ├── main.ts                        # Entry point — bootstraps App with appConfig
│   ├── styles.css                     # Global styles (@import "tailwindcss")
│   ├── index.html                     # HTML shell
│   ├── environments/
│   │   ├── environment.ts             # Dev: pocketbaseUrl = http://localhost:8080
│   │   └── environment.prod.ts        # Prod: update pocketbaseUrl before deploying
│   └── app/
│       ├── app.ts                     # Root component — loads todos, shows error on failure
│       ├── app.config.ts              # ApplicationConfig: provideRouter, provideBrowserGlobalErrorListeners
│       ├── app.routes.ts              # Route definitions (currently empty)
│       ├── app.css                    # Root component styles
│       ├── app.html                   # Root component template
│       ├── pocketbase.service.ts      # Singleton PocketBase client (reads from environment)
│       ├── error/
│       │   └── backend-error.ts       # Full-page error screen when backend is unreachable
│       └── todo/
│           ├── todo.ts                # Todo interface: { id, title, completed, created, updated }
│           ├── todo.service.ts        # CRUD + realtime SSE subscription via PocketBase
│           ├── todo-list.ts           # TodoListComponent — form + list, signals-driven
│           ├── todo-item.ts           # TodoItemComponent — single row with toggle/delete
│           └── *.spec.ts              # Vitest specs colocated with implementation files
├── pocketbase/
│   ├── Dockerfile                     # Alpine + PocketBase 0.36.4 binary
│   ├── pb_migrations/
│   │   └── 1_create_todos.js          # Auto-migration: creates 'todos' collection on first run
│   └── pb_data/                       # SQLite data dir (gitignored), mounted as Docker volume
├── specs/
│   └── 001-pocketbase-todo/           # Feature specification artifacts
│       ├── spec.md                    # User stories, requirements, acceptance criteria
│       ├── plan.md                    # Implementation plan
│       ├── tasks.md                   # Ordered task list
│       ├── data-model.md              # PocketBase schema docs
│       ├── quickstart.md              # Developer setup guide
│       └── contracts/
│           └── pocketbase-todos-api.md  # PocketBase API contract
├── .specify/
│   ├── memory/constitution.md         # Project constitution (principles, ratified v1.0.0)
│   └── templates/                     # speckit templates for spec/plan/tasks generation
├── .claude/commands/                  # Custom Claude slash commands (speckit.*)
├── angular.json                       # Angular CLI configuration
├── tsconfig.json                      # Root TypeScript config (strict mode settings)
├── tsconfig.app.json                  # App TypeScript config
├── tsconfig.spec.json                 # Test TypeScript config (includes vitest/globals types)
├── .postcssrc.json                    # PostCSS config for Tailwind v4
├── docker-compose.yml                 # PocketBase service definition
└── package.json                       # Dependencies + Prettier config
```

## Architecture

This is an Angular 21 + PocketBase proof-of-concept todo application. PocketBase is fully integrated: the Angular frontend communicates with a PocketBase backend (running via Docker Compose) for all data persistence and real-time updates.

### Key Architectural Patterns

- **Standalone components only** — no NgModules. Every component uses `imports: [...]` directly in its `@Component` decorator.
- **Signals for state** — use Angular `signal()`, `computed()`, and `effect()` for reactive state. RxJS subjects are prohibited for new state; use RxJS only where Angular APIs require it (e.g., routing).
- **App bootstrap**: `src/main.ts` → `bootstrapApplication(App, appConfig)` where `appConfig` (`src/app/app.config.ts`) holds all root-level providers.
- **Routes**: defined in `src/app/app.routes.ts`, provided via `provideRouter(routes)` in `appConfig`. Currently empty (single-page app).
- **Styling**: Tailwind CSS v4 imported globally in `src/styles.css` via `@import "tailwindcss"`. PostCSS handles the build via `.postcssrc.json`. No separate Tailwind config file — v4 is zero-config.
- **Testing**: Vitest (not Karma/Jest). Tests use Angular's `TestBed`. Spec files colocated with their implementation files.

### PocketBase Integration

- **Client**: `PocketBaseService` (`src/app/pocketbase.service.ts`) is an `@Injectable({ providedIn: 'root' })` service exposing a single `readonly client: PocketBase` instance configured from `environment.pocketbaseUrl`.
- **Data layer**: `TodoService` injects `PocketBaseService` and owns all CRUD operations (`load`, `create`, `toggleTodo`, `deleteTodo`) plus a real-time SSE subscription.
- **Realtime**: After `load()`, `TodoService.startRealtime()` subscribes to `pb.collection('todos').subscribe('*', callback)`. The SSE callback fires outside the Angular zone, but Angular Signals are zone-agnostic — mutations to signals in the callback update the UI correctly.
- **Error handling**: The root `App` component catches failures from `todoService.load()` and shows `BackendErrorComponent` (full-page error) if PocketBase is unreachable.
- **Environment files**: `src/environments/environment.ts` (dev, `localhost:8080`) is swapped for `environment.prod.ts` automatically by the Angular build during `npm run build`.

### PocketBase Data Model

`todos` collection (defined in `pocketbase/pb_migrations/1_create_todos.js`, applied automatically on container startup):

| Field       | Type     | Constraints              |
|-------------|----------|--------------------------|
| `id`        | string   | Auto-generated by PocketBase |
| `title`     | text     | Required, max 200 chars  |
| `completed` | bool     | Defaults to false        |
| `created`   | autodate | Set on create only       |
| `updated`   | autodate | Set on create and update |

All collection rules (list, view, create, update, delete) are open (`''` — no auth required). This is intentional for a POC showcase.

### Todo Interface

```typescript
interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created: string;   // ISO 8601
  updated: string;   // ISO 8601
}
```

## TypeScript Configuration

Strict mode is fully enabled. Never suppress or work around these settings:

- `strict: true` (includes `strictNullChecks`, `strictFunctionTypes`, etc.)
- `strictTemplates: true` — Angular template type checking
- `noImplicitOverride: true`
- `noImplicitReturns: true`
- `noPropertyAccessFromIndexSignature: true`
- `noFallthroughCasesInSwitch: true`

Type assertions (`as SomeType`) must be avoided unless demonstrably unavoidable.

## Prettier Configuration

Defined in `package.json`:

- `printWidth: 100`
- `singleQuote: true`
- HTML files use the Angular parser

## Testing Conventions

- **Framework**: Vitest with Angular's `TestBed`. Vitest globals (`describe`, `it`, `expect`, `vi`, `beforeEach`) are available without imports (configured in `tsconfig.spec.json` via `"types": ["vitest/globals"]`).
- **Colocation**: Spec files live alongside implementation files (e.g., `todo.service.spec.ts` next to `todo.service.ts`).
- **Service testing pattern**: Provide a mock `PocketBaseService` with a spy on `.client.collection()`:
  ```typescript
  TestBed.configureTestingModule({
    providers: [
      TodoService,
      { provide: PocketBaseService, useValue: { client: { collection: vi.fn().mockReturnValue(collectionApi) } } },
    ],
  });
  ```
- **Component testing pattern**: Import the standalone component in `TestBed.configureTestingModule({ imports: [MyComponent] })` and override services via `providers`.
- **TDD is mandatory** (see Constitution below) — write the failing test first, then the minimum implementation.

## Project Constitution (v1.0.0)

The constitution in `.specify/memory/constitution.md` governs all development. Key rules:

1. **KISS** — Choose the simplest design. Prefer flat structures, built-in Angular primitives, inline logic.
2. **Clean Code** — Intention-revealing names, single-responsibility functions/classes, no `as` type assertions unless unavoidable.
3. **TDD (NON-NEGOTIABLE)** — Red-Green-Refactor. Write a failing test before any production code. `npm test` must pass before marking any task complete.
4. **Minimum Code (YAGNI)** — Only write code for current, explicit requirements. No speculative abstractions, dead branches, or unused code.
5. **Minimal Comments** — Code must be self-documenting. Comments only where the reasoning is non-obvious (algorithm quirks, framework workarounds). No docstrings, section headers, or code-restatement comments.

## Development Workflow

### Starting the full stack

```bash
# Terminal 1: Start PocketBase
docker compose up --build

# Terminal 2: Start Angular dev server
npm start
```

- PocketBase admin UI: `http://localhost:8080/_/` (create an admin account on first run)
- Angular app: `http://localhost:4200`

### Running tests

```bash
npm test                                              # All tests
ng test --include src/app/todo/todo.service.spec.ts   # Single file
```

### Feature development workflow (speckit)

Feature specs live in `specs/<feature-id>/`. The `.claude/commands/` directory contains `speckit.*` slash commands for managing the spec lifecycle:

- `/speckit.specify` — create or update a feature spec from natural language
- `/speckit.clarify` — ask targeted clarification questions and encode answers into the spec
- `/speckit.plan` — generate a design/implementation plan
- `/speckit.tasks` — generate an ordered task list from the plan
- `/speckit.implement` — execute tasks from `tasks.md`
- `/speckit.checklist` — generate a requirements checklist
- `/speckit.analyze` — cross-artifact consistency check

### PocketBase migrations

Database schema changes belong in `pocketbase/pb_migrations/`. Migrations are JS files using PocketBase's migration API and run automatically when the container starts. Always provide a down function (rollback) alongside the up function.

## Active Technologies

| Technology | Version | Role |
|---|---|---|
| Angular | 21.1 | Frontend framework |
| TypeScript | 5.9 | Language |
| PocketBase (JS SDK) | ^0.26.8 | Backend client library |
| PocketBase (server) | 0.36.4 | Backend: SQLite DB + REST + SSE |
| Tailwind CSS | v4 | Utility-first styling |
| Vitest | ^4.0.8 | Unit test runner |
| Docker Compose | — | PocketBase container orchestration |

## Recent Changes

- **001-pocketbase-todo**: Implemented full todo CRUD + real-time updates via PocketBase SSE. Added `PocketBaseService`, `TodoService`, `TodoListComponent`, `TodoItemComponent`, `BackendErrorComponent`, environment files, Docker Compose setup, and PocketBase migration.
