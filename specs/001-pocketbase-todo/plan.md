# Implementation Plan: PocketBase Todo Showcase

**Branch**: `001-pocketbase-todo` | **Date**: 2026-02-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-pocketbase-todo/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a minimal Angular 21 + PocketBase todo SPA showcasing real-time CRUD. PocketBase runs via Docker Compose; the Angular dev server runs on the host. The app uses Angular signals for all state, a single `TodoService` backed by the PocketBase JS SDK, and PocketBase's SSE realtime subscription for live cross-tab sync.

## Technical Context

**Language/Version**: TypeScript 5.9, Angular 21.1
**Primary Dependencies**: `pocketbase@^0.26.8`, Tailwind CSS v4
**Storage**: PocketBase 0.36.4 (SQLite, managed by PocketBase, served via Docker Compose)
**Testing**: Vitest + Angular TestBed
**Target Platform**: Modern browsers — Chrome, Firefox, Safari, Edge (latest stable)
**Project Type**: Web SPA — Angular frontend (existing scaffold at `src/`), PocketBase as backend-as-a-service (`pocketbase/`)
**Performance Goals**: All todo operations reflected in UI within 1 second (SC-002); real-time cross-tab updates within 3 seconds (SC-003)
**Constraints**: No auth, public access, POC scope only, no SSR
**Scale/Scope**: Single-page showcase app; up to 200 todos fetched per load

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| **I. KISS** | ✅ Pass | Single-page app, no routing, flat component tree. No abstractions beyond what FRs demand. |
| **II. Clean Code** | ✅ Pass | Standalone components, signals for all state, strict TypeScript enforced, Prettier configured. |
| **III. TDD** | ✅ Pass | All tasks write failing tests first. `PocketBaseService` stubbed in unit tests via `TestBed.overrideProvider`. |
| **IV. Minimum Code** | ✅ Pass | No routing (single view), no helper utilities, no speculative features. YAGNI enforced. |
| **V. Minimal Comments** | ✅ Pass | Zone-safety of SSE callbacks is the only non-obvious behaviour; one-line comment warranted there. |

No violations — Complexity Tracking table not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-pocketbase-todo/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── pocketbase-todos-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── environments/
│   ├── environment.ts           # Dev: pocketbaseUrl = 'http://localhost:8080'
│   └── environment.prod.ts      # Prod: update pocketbaseUrl before deploying
└── app/
    ├── app.ts                   # Root shell — renders todo-list or backend-error
    ├── app.config.ts            # Root providers (no changes needed)
    ├── app.routes.ts            # Empty — single-page app, no routing
    ├── pocketbase.service.ts    # @Injectable root — wraps new PocketBase(url)
    ├── pocketbase.service.spec.ts
    ├── todo/
    │   ├── todo.service.ts      # CRUD + realtime; exposes signal<Todo[]>
    │   ├── todo.service.spec.ts
    │   ├── todo-list.ts         # List + create form; root view component
    │   ├── todo-list.spec.ts
    │   ├── todo-item.ts         # Single row: checkbox, title, delete button
    │   └── todo-item.spec.ts
    └── error/
        ├── backend-error.ts     # Full-page error screen (backend unreachable)
        └── backend-error.spec.ts

pocketbase/
├── Dockerfile                   # Alpine + PocketBase 0.36.4 binary (update: add --origins, uncomment COPY)
└── pb_migrations/
    └── 1_create_todos.js        # Creates todos collection on first startup

docker-compose.yml               # PocketBase service (update: switch to bind mount)
angular.json                     # (update: add fileReplacements for prod build)
.gitignore                       # (update: add pocketbase/pb_data/)
```

**Structure Decision**: Single Angular project (existing scaffold). No separate backend project — PocketBase is the backend. Feature folders (`todo/`, `error/`) keep related component+test pairs co-located. No shared utilities or route configuration needed.

## Complexity Tracking

> No violations — section not applicable.

## Component Architecture

### `App` (root shell)

- Injects `TodoService`
- On `ngOnInit`: calls `todoService.load()` — on network error sets `hasError = true`
- Template: renders `<app-todo-list>` when `!hasError`, `<app-backend-error>` when `hasError`
- No routing, no lazy loading

### `TodoListComponent`

- Injects `TodoService`
- Reads `todoService.todos` signal (sorted newest-first, computed in service)
- Contains the create form: `<input>` bound to a local `title` signal, submit button
- Validates on submit: trims whitespace, enforces max 200 chars, shows inline message
- Renders `<app-todo-item *ngFor>` for each todo
- Handles `loading` state during initial `load()` call

### `TodoItemComponent`

- Accepts `@Input() todo: Todo`
- Emits no outputs — calls `TodoService` directly (injected)
- Checkbox toggles `todo.completed` via `todoService.toggleTodo()`
- Title displayed with `line-through text-gray-400` Tailwind classes when completed (FR-007)
- Delete button calls `todoService.deleteTodo()`

### `BackendErrorComponent`

- Stateless presentational component
- Full-page message: "Cannot connect to backend. Make sure Docker is running."
- No retry logic (KISS — a page refresh is sufficient for a POC)

### `PocketBaseService`

```typescript
@Injectable({ providedIn: 'root' })
export class PocketBaseService {
  readonly client = new PocketBase(environment.pocketbaseUrl);
}
```

### `TodoService`

- `_todos = signal<Todo[]>([])`
- `loading = signal(false)` — set to `true` before `getList()`, `false` after (success or error)
- `todos = computed(() => [..._todos()].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()))` — sort kept for realtime insert consistency
- `load()`: sets `loading(true)`, fetches list, sets `_todos`, calls `startRealtime()`, sets `loading(false)`; rejects Promise on network error
- `startRealtime()` (private): opens `pb.collection('todos').subscribe('*', callback)`; stores unsubscribe function
- `create(title)`: calls `pb.collection('todos').create()` — realtime event updates signal
- `toggleTodo(id, completed)`: calls `update()` — realtime event updates signal
- `deleteTodo(id)`: calls `delete()` — realtime event updates signal
- `ngOnDestroy()`: calls unsubscribe function

**Realtime strategy**: Server is the source of truth. After a `create/update/delete` call, the app does NOT optimistically update `_todos`. It waits for the SSE event to arrive (typically <100ms on localhost). This ensures cross-tab consistency and simplifies the code.

## Key Implementation Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Optimistic vs server-driven updates | Server-driven (wait for SSE event) | Simplest code; ensures cross-tab consistency; fulfils FR-009 |
| Routing | None (single view) | No multi-page navigation needed; simplifies bootstrap |
| Error on operations | Silent (log to console) | POC scope; network errors during CRUD are transient; full-page error only on initial load failure |
| Title validation | Client-side only (trim + length) | PocketBase also validates; client validation gives immediate feedback |
| Tailwind components | Inline Tailwind classes | No component library; Tailwind v4 already configured; minimal code |
