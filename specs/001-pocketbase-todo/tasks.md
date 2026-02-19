# Tasks: PocketBase Todo Showcase

**Input**: Design documents from `/specs/001-pocketbase-todo/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Included per project constitution (TDD is non-negotiable — tests MUST be written before implementation).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- TDD marker: test tasks must be written and **confirmed failing** before their paired implementation task begins

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Environment config, Docker wiring, PocketBase migration — no Angular feature code.

- [X] T001 Install `pocketbase` npm package — run `npm install pocketbase` (updates `package.json` and `package-lock.json`)
- [X] T002 [P] Create `src/environments/environment.ts` with `pocketbaseUrl: 'http://localhost:8080'` and `production: false`
- [X] T003 [P] Create `src/environments/environment.prod.ts` with `pocketbaseUrl` placeholder and `production: true`
- [X] T004 Add `fileReplacements` to the `production` configuration in `angular.json` to swap `environment.ts` → `environment.prod.ts` at build time
- [X] T005 [P] Create `pocketbase/pb_migrations/1_create_todos.js` — JS migration defining the `todos` collection (`title` text required max 200, `completed` bool, all API rules empty for public access)
- [X] T006 Update `pocketbase/Dockerfile` — uncomment `COPY ./pb_migrations /pb/pb_migrations` and add `--origins=http://localhost:4200` to the `CMD` serve command
- [X] T007 [P] Update `docker-compose.yml` — replace named volume `pb_data` with bind mount `./pocketbase/pb_data:/pb/pb_data`
- [X] T008 [P] Add `pocketbase/pb_data/` to `.gitignore`

**Checkpoint**: `docker compose up --build` should start PocketBase with the `todos` collection created automatically.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `PocketBaseService` and the `Todo` interface — required by every user story. No user story can begin until this phase is complete.

**⚠️ CRITICAL**: TDD — write tests first, confirm they FAIL, then implement.

- [X] T009 Write failing tests for `PocketBaseService` in `src/app/pocketbase.service.spec.ts` — verify the service is injectable and exposes a `client` property that is a `PocketBase` instance pointing to `environment.pocketbaseUrl`
- [X] T010 Implement `PocketBaseService` in `src/app/pocketbase.service.ts` — `@Injectable({ providedIn: 'root' })`, `readonly client = new PocketBase(environment.pocketbaseUrl)` (makes T009 pass)
- [X] T011 [P] Define `Todo` interface in `src/app/todo/todo.ts` — fields: `id: string`, `title: string`, `completed: boolean`, `created: string`, `updated: string`

**Checkpoint**: `npm test` passes for `pocketbase.service.spec.ts`. Foundation ready — user story phases can begin.

---

## Phase 3: User Story 1 — View and Create Todos (Priority: P1) 🎯 MVP

**Goal**: User can open the app and see all existing todos (or an empty state). They can type a title and submit to create a new todo that appears immediately. If PocketBase is unreachable on load, a full-page error screen is shown.

**Independent Test**: Open the app with Docker running — confirm the empty state renders. Add a todo title and submit — confirm it appears in the list. Stop Docker and refresh — confirm the error screen appears.

> **⚠️ TDD: Write tests first. Confirm they FAIL before implementing.**

- [X] T012 [US1] Write failing tests for `TodoService` (load + create) in `src/app/todo/todo.service.spec.ts` — stub `PocketBaseService` via `TestBed.overrideProvider`; test: `todos` signal is empty on init, `load()` populates `todos` from the stub, `create(title)` calls `pb.collection('todos').create()`, empty/whitespace title throws before calling PocketBase
- [X] T013 [P] [US1] Write failing tests for `TodoListComponent` in `src/app/todo/todo-list.spec.ts` — test: list renders one row per todo, empty state message shown when `todos` is empty, loading indicator shown while loading, submit with valid title calls `TodoService.create()`, submit with blank title shows validation message and does not call `create()`, submit with 201-char title shows validation message
- [X] T014 [P] [US1] Write failing tests for `BackendErrorComponent` in `src/app/error/backend-error.spec.ts` — test: component renders and contains a message indicating the backend is unavailable
- [X] T015 [US1] Implement `TodoService` in `src/app/todo/todo.service.ts` — `@Injectable({ providedIn: 'root' })`; `_todos = signal<Todo[]>([])`, `todos = computed(...)` (pass-through; realtime will maintain sort); `load()` calls `getList(1, 200, { sort: '-created' })` and sets `_todos`, throws on network error; `create(title)` trims and validates before calling `pb.collection('todos').create()` (makes T012 pass; depends on T010, T011)
- [X] T016 [US1] Implement `TodoListComponent` in `src/app/todo/todo-list.ts` — standalone component; injects `TodoService`; renders `@for (todo of todoService.todos())` with todo title and read-only completion indicator; shows empty state message when `todos()` is empty; shows loading indicator while `load()` is in progress; create form with `<input>` and submit button; client-side validation: trim, non-empty, max 200 chars, inline error message on failure; calls `todoService.create()` on valid submit (makes T013 pass; depends on T015)
- [X] T017 [P] [US1] Implement `BackendErrorComponent` in `src/app/error/backend-error.ts` — standalone, stateless; renders a full-page message: "Cannot connect to backend. Make sure Docker is running." (makes T014 pass)
- [X] T018 [US1] Write failing tests for `App` component in `src/app/app.spec.ts` — stub `TodoService` via `TestBed.overrideProvider`; test: `load()` is called on `ngOnInit`; when `load()` resolves, `<app-todo-list>` is rendered; when `load()` rejects, `<app-backend-error>` is rendered and `<app-todo-list>` is absent
- [X] T019 [US1] Update `App` component in `src/app/app.ts` — inject `TodoService`; on `ngOnInit` call `await todoService.load()` inside a `try/catch`, set `hasError = signal(false)` to `true` on error; update `src/app/app.html` to render `<app-backend-error>` when `hasError()` or `<app-todo-list>` otherwise; import both components (makes T018 pass)

**Checkpoint**: `npm test` all green. `docker compose up --build && npm start` → app at `http://localhost:4200` shows empty state. Add a todo → it appears in the list.

---

## Phase 4: User Story 2 — Complete and Reopen a Todo (Priority: P2)

**Goal**: User can click a checkbox on any todo to mark it complete. Completed todos display with strikethrough title and muted/grey text. Clicking again reopens it. State persists on page refresh.

**Independent Test**: Create a todo, check the checkbox — verify strikethrough and grey text appear. Refresh the page — verify the completed state is preserved. Uncheck — verify it returns to normal.

> **⚠️ TDD: Write tests first. Confirm they FAIL before implementing.**

- [X] T020 [US2] Write failing tests for `TodoService.toggleTodo()` in `src/app/todo/todo.service.spec.ts` — test: `toggleTodo(id, completed)` calls `pb.collection('todos').update(id, { completed })` with the stubbed client
- [X] T021 [P] [US2] Write failing tests for `TodoItemComponent` in `src/app/todo/todo-item.spec.ts` — test: renders todo title; when `todo.completed` is false, no strikethrough class present; when `todo.completed` is true, title has `line-through` and `text-gray-400` Tailwind classes; clicking the checkbox calls `TodoService.toggleTodo()` with toggled value
- [X] T022 [US2] Implement `TodoService.toggleTodo()` in `src/app/todo/todo.service.ts` — add `toggleTodo(id: string, completed: boolean)` calling `pb.collection('todos').update(id, { completed })` (makes T020 pass)
- [X] T023 [US2] Create `TodoItemComponent` in `src/app/todo/todo-item.ts` — standalone; `@Input() todo!: Todo`; injects `TodoService`; checkbox bound to `todo.completed` — on change calls `todoService.toggleTodo(todo.id, !todo.completed)`; applies `line-through text-gray-400` Tailwind classes to title when `todo.completed` is true (makes T021 pass; depends on T022)
- [X] T024 [US2] Write failing tests in `src/app/todo/todo-list.spec.ts` — add test: after refactor, `@for` renders `<app-todo-item>` elements (one per todo) instead of raw divs; existing T013 tests continue to pass
- [X] T025 [US2] Replace inline item rendering in `TodoListComponent` with `<app-todo-item [todo]="todo">` in `src/app/todo/todo-list.ts` — import `TodoItemComponent`; remove any inline completed-state logic (makes T024 pass; depends on T023; ⚠️ US3 cannot start until this task is complete)

**Checkpoint**: `npm test` all green. Toggle a todo in the browser — strikethrough appears immediately. Refresh — state persists.

---

## Phase 5: User Story 3 — Delete a Todo (Priority: P3)

**Goal**: User can click a delete button on any todo to permanently remove it from the list.

**Independent Test**: Create a todo, click its delete button — verify it disappears from the list immediately. Refresh — verify it does not return.

> **⚠️ TDD: Write tests first. Confirm they FAIL before implementing.**

- [X] T026 [US3] Write failing tests for `TodoService.deleteTodo()` in `src/app/todo/todo.service.spec.ts` — test: `deleteTodo(id)` calls `pb.collection('todos').delete(id)` with the stubbed client
- [X] T027 [P] [US3] Write failing tests for delete button in `TodoItemComponent` in `src/app/todo/todo-item.spec.ts` — test: a delete button is rendered; clicking it calls `TodoService.deleteTodo()` with the todo's `id`
- [X] T028 [US3] Implement `TodoService.deleteTodo()` in `src/app/todo/todo.service.ts` — add `deleteTodo(id: string)` calling `pb.collection('todos').delete(id)` (makes T026 pass)
- [X] T029 [US3] Add delete button to `TodoItemComponent` in `src/app/todo/todo-item.ts` — button calls `todoService.deleteTodo(todo.id)` on click (makes T027 pass; depends on T028)

**Checkpoint**: `npm test` all green. Delete button removes a todo in the browser. Refresh — it stays gone.

---

## Phase 6: User Story 4 — Real-time Updates Across Sessions (Priority: P4)

**Goal**: Changes (create, toggle, delete) made in one browser tab automatically appear in all other open tabs within 3 seconds, without a manual page refresh.

**Independent Test**: Open the app in two tabs. Create a todo in Tab A — it appears in Tab B within 3 seconds. Toggle completion in Tab A — Tab B reflects the change. Delete in Tab A — Tab B removes it.

> **⚠️ TDD: Write tests first. Confirm they FAIL before implementing.**

- [X] T030 [US4] Write failing tests for `TodoService` realtime subscription in `src/app/todo/todo.service.spec.ts` — stub the PocketBase client's `subscribe` method; simulate `create`, `update`, and `delete` SSE events; test that: a `create` event appends the new record to `_todos`, an `update` event replaces the matching record in `_todos`, a `delete` event removes the matching record from `_todos`; test that `ngOnDestroy` calls the unsubscribe function
- [X] T031 [US4] Implement `TodoService.startRealtime()` and `ngOnDestroy()` in `src/app/todo/todo.service.ts` — `startRealtime()` is called at the end of `load()`; opens SSE subscription to `pb.collection('todos').subscribe('*', callback)`; callback handles `create`/`update`/`delete` actions by mutating `_todos` signal; stores unsubscribe function; `ngOnDestroy()` calls it (makes T030 pass)

**Checkpoint**: `npm test` all green. Open app in two tabs — changes in one tab appear in the other within 3 seconds.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Visual consistency and final validation.

- [X] T032 [P] Apply Tailwind layout polish to `src/app/app.ts`, `src/app/todo/todo-list.ts`, `src/app/todo/todo-item.ts`, and `src/app/error/backend-error.ts` — centred max-width container, consistent padding/spacing, visible focus rings on inputs and buttons, accessible `aria-label`/`for`+`id` pairs on create form (extend relevant `.spec.ts` files with label presence assertions before adding the labels)
- [ ] T033 Manual end-to-end validation following `specs/001-pocketbase-todo/quickstart.md` — run `docker compose up --build && npm start`; exercise all four user stories; time a create operation to confirm SC-002 (<1s); repeat create+toggle+delete in a non-Chrome browser (SC-004); confirm SC-001 and SC-005

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Requires Phase 1 complete — **BLOCKS all user story phases**
- **User Story Phases (3–6)**: All require Phase 2 complete; can then proceed in priority order (P1 → P2 → P3 → P4) or in parallel if staffed
- **Polish (Phase 7)**: Requires all desired user story phases complete

### User Story Dependencies

- **US1 (P1)**: Requires Foundational only — no dependency on other user stories
- **US2 (P2)**: Requires Foundational only — independent of US1 (but shares `TodoService`)
- **US3 (P3)**: Requires T023 (`TodoItemComponent`, created in US2) — US3 cannot start until T023 is complete
- **US4 (P4)**: Requires Foundational only — independent (extends `TodoService.load()`)

### Within Each User Story

1. Write tests → confirm they **FAIL** (Red)
2. Implement until tests pass (Green)
3. Refactor if needed (Refactor)
4. `npm test` must be fully green before marking story complete

### Parallel Opportunities

- T002, T003, T005, T007, T008 can all run in parallel (Phase 1)
- T009 and T011 can run in parallel (Phase 2)
- T013 and T014 can run in parallel with T012 (Phase 3 tests)
- T017 can run in parallel with T016 (Phase 3 implementation)
- T021 and T020 can run in parallel (Phase 4 tests)
- T026 and T027 can run in parallel (Phase 5 tests)

---

## Parallel Example: Phase 1

```bash
# After T001 (npm install), launch in parallel:
Task: "Create src/environments/environment.ts"           # T002
Task: "Create src/environments/environment.prod.ts"      # T003
Task: "Create pocketbase/pb_migrations/1_create_todos.js" # T005
Task: "Update docker-compose.yml bind mount"             # T007
Task: "Update .gitignore"                                # T008

# Then sequentially:
Task: "Update angular.json fileReplacements"             # T004 (after T002, T003 exist)
Task: "Update pocketbase/Dockerfile"                     # T006 (after T005 exists)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (**CRITICAL** — blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: `npm test` green; manual walkthrough in browser
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → infrastructure ready (Phases 1–2)
2. User Story 1 → list and create working → **Demo-able MVP** (Phase 3)
3. User Story 2 → toggle complete → demo updated (Phase 4)
4. User Story 3 → delete → demo updated (Phase 5)
5. User Story 4 → realtime cross-tab → full showcase (Phase 6)
6. Polish → visual consistency (Phase 7)

---

## Notes

- `[P]` tasks touch different files with no blocking dependencies — safe to parallelise
- `[Story]` label maps each task to the spec user story for full traceability
- Each user story is independently completable and testable from Foundational onwards
- **Never skip the Red step**: if a test passes before implementation, the test is wrong
- `npm test` must be green before committing any task or advancing to the next phase
- `TodoService` methods accumulate across phases (load in US1, toggleTodo in US2, deleteTodo in US3, realtime in US4) — this is intentional incremental growth
- `TodoItemComponent` is introduced in US2; US1 renders todo rows inline in `TodoListComponent`
- Stop at any checkpoint to validate the story in the browser before continuing
