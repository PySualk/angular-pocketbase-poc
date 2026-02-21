# Tasks: User Authentication

**Input**: Design documents from `/specs/002-user-auth/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**TDD Note**: Tests are **mandatory** per the project constitution (Principle III). Every implementation task is preceded by a failing-test task. Run `npm test` after each implementation step to confirm green.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on each other)
- **[Story]**: User story this task belongs to (US1–US5 from spec.md)

---

## Phase 1: Setup (Backend Infrastructure)

**Purpose**: Docker and PocketBase foundation required before any Angular work.

- [X] T001 Add Mailpit service (`axllent/mailpit`, ports 1025 + 8025) to `docker-compose.yml`
- [X] T002 [P] Write migration `pocketbase/pb_migrations/2_add_user_auth_to_todos.js`: drop existing `todos` collection and recreate with `owner` relation field (→ `users`, required, maxSelect 1) + auth-scoped rules (`listRule/viewRule: owner = @request.auth.id`, `createRule: @request.auth.id != ""`, `updateRule/deleteRule: owner = @request.auth.id`)
- [X] T003 [P] Write migration `pocketbase/pb_migrations/3_configure_smtp.js`: configure PocketBase SMTP host → `mailpit`, port → `1025`, set app URL → `http://localhost:4200`, set `users` collection password-reset action URL → `{APP_URL}/auth/confirm-reset`

**Checkpoint**: Run `docker compose down -v && docker compose up --build`. PocketBase starts, both migrations apply, Mailpit inbox accessible at `http://localhost:8025`. No manual admin steps needed.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: `AuthService`, guards, and routing — required before ANY auth UI story can be implemented.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T004 [P] Write failing tests for `AuthService` (register, login, logout, requestPasswordReset, confirmPasswordReset, `currentUser` signal initialised from `authStore`, `isAuthenticated` computed, `onChange` cleanup on destroy) in `src/app/auth/auth.service.spec.ts`
- [X] T005 [P] Write failing tests for `authGuard` (redirects unauthenticated to `/auth/login`, allows authenticated) and `guestGuard` (redirects authenticated to `/`, allows unauthenticated) in `src/app/auth/auth.guard.spec.ts`
- [X] T006 Implement `AuthService`: `register(email, password, passwordConfirm)` → create + authWithPassword; `login(email, password)` → authWithPassword; `logout()` → authStore.clear(); `requestPasswordReset(email)`; `confirmPasswordReset(token, password, passwordConfirm)`; `currentUser = signal(pb.authStore.record)` initialised via `onChange(cb, true)`; `isAuthenticated = computed(() => currentUser() !== null)`; unsubscribe in `ngOnDestroy` in `src/app/auth/auth.service.ts` — depends on T004
- [X] T007 Implement `authGuard` and `guestGuard` as `CanActivateFn` functions using `inject(AuthService)` and `inject(Router)` in `src/app/auth/auth.guard.ts` — depends on T005 + T006
- [X] T008 Update `src/app/app.routes.ts`: define routes `''` → `TodoListComponent` + `authGuard`; `auth/login` → `LoginComponent` + `guestGuard`; `auth/register` → `RegisterComponent` + `guestGuard`; `auth/confirm-reset` → `ConfirmResetComponent`; `**` → redirectTo `''` — depends on T007
- [X] T009 [P] Update `src/app/app.config.ts`: add `withComponentInputBinding()` to `provideRouter(routes, withComponentInputBinding())` — depends on T008
- [X] T010 [P] Simplify `src/app/app.ts` to a `<router-outlet />` shell: remove `TodoService` injection, `ngOnInit`, error signal, and imports of `TodoListComponent`/`BackendErrorComponent`; add `RouterOutlet` to imports — depends on T008

**Checkpoint**: Run `npm test`. All `auth.service.spec.ts` and `auth.guard.spec.ts` tests pass. App boots with routing. Unauthenticated visit to `http://localhost:4200` redirects to `/auth/login` (404 component renders since `LoginComponent` is not yet implemented — this is expected).

---

## Phase 3: User Story 1 — Account Registration (Priority: P1) 🎯 MVP

**Goal**: New users can create an account with email + password + confirm, are signed in automatically, and land on the todo list.

**Independent Test**: Visit `/auth/register`, submit a valid email + matching passwords (≥8 chars), verify redirect to `/` and the todo list is shown.

- [X] T011 [US1] Write failing tests for `RegisterComponent`: valid submission calls `authService.register()` and navigates to `/`; mismatched passwords shows validation error before submit; short password shows validation error; duplicate email shows server error; form disabled during submission in `src/app/auth/register/register.spec.ts`
- [X] T012 [US1] Implement `RegisterComponent`: standalone component with email, password, passwordConfirm inputs; client-side validation (email format, min 8 chars, passwords match); calls `authService.register()`; on success navigates to `/`; displays server error on duplicate email; disables form during submission; link to `/auth/login` in `src/app/auth/register/register.ts`

**Checkpoint**: Run `npm test`. All `register.spec.ts` tests pass. Manual test: visit `/auth/register`, create an account, verify auto-redirect to `/` (todo list — which shows backend error until Phase 5 wires `TodoListComponent`).

---

## Phase 4: User Story 2 — Sign In (Priority: P1)

**Goal**: Registered users can sign in with email + password and land on the todo list.

**Independent Test**: With an existing account, visit `/auth/login`, submit credentials, verify redirect to `/`.

- [X] T013 [US2] Write failing tests for `LoginComponent`: valid credentials call `authService.login()` and navigate to `/`; invalid credentials show generic "Invalid email or password" error (no field disclosure); authenticated user visiting `/auth/login` redirects to `/` (guestGuard); form disabled during submission; "forgot password" section visible with email input that calls `authService.requestPasswordReset()` and shows success message in `src/app/auth/login/login.spec.ts`
- [X] T014 [US2] Implement `LoginComponent`: standalone component with email + password inputs; calls `authService.login()`; on success navigates to `/`; displays generic error on 400; disables form during submission; "Forgot password?" section with email input + submit that calls `authService.requestPasswordReset()` and shows "Check your email" confirmation; link to `/auth/register` in `src/app/auth/login/login.ts`

**Checkpoint**: Run `npm test`. All `login.spec.ts` tests pass. Manual test: register an account, sign out (no button yet), sign back in via `/auth/login`, verify redirect to `/`.

---

## Phase 5: User Story 3 + User Story 4 — Sign Out & Protected Access (Priority: P1)

**Goal**: Signed-in users see only their own todos; unauthenticated users are blocked; sign-out ends the session.

**Independent Test (US3)**: From the todo list, click "Sign out", verify redirect to `/auth/login`. Attempt to navigate back to `/` and verify redirect to `/auth/login`.

**Independent Test (US4)**: Create two accounts, add todos to each. Sign in as Account A and verify Account B's todos are not visible (and vice versa).

- [X] T015 [P] [US3] [US4] Write failing tests for updated `TodoService`: `create()` includes `owner` field from `pb.authStore.record.id`; `load()` returns only authenticated user's todos (server-side rule — test via mock) in `src/app/todo/todo.service.spec.ts`
- [X] T016 [P] [US3] [US4] Write failing tests for updated `TodoListComponent`: component calls `todoService.load()` in `ngOnInit`; displays `authService.currentUser()` email/name; "Sign out" button calls `authService.logout()` and navigates to `/auth/login`; shows `BackendErrorComponent` on load failure in `src/app/todo/todo-list.spec.ts`
- [X] T017 [US3] [US4] Update `TodoService.create()` to include `owner: this.pb.authStore.record!.id` in the request body in `src/app/todo/todo.service.ts` — depends on T015
- [X] T018 [US3] [US4] Update `TodoListComponent`: add `ngOnInit` that calls `todoService.load()` and sets error signal on failure; add `BackendErrorComponent` import; inject `AuthService`; display current user identity (email or name); add "Sign out" button that calls `authService.logout()` and navigates to `/auth/login` in `src/app/todo/todo-list.ts` — depends on T016 + T017

**Checkpoint**: Run `npm test`. All `todo.service.spec.ts` and `todo-list.spec.ts` tests pass. Full flow working: register → see empty todo list → add todos → sign out → redirected to login → sign back in → see only own todos.

---

## Phase 6: User Story 5 — Password Reset (Priority: P2)

**Goal**: Users who forgot their password receive a reset email and can set a new password via an in-app page.

**Independent Test**: Request reset via the "Forgot password?" form on `/auth/login`, open Mailpit at `http://localhost:8025`, follow the reset link, set a new password, sign in with the new password successfully.

- [X] T019 [US5] Write failing tests for `ConfirmResetComponent`: reads `token` from `@Input()`; valid submission calls `authService.confirmPasswordReset(token, password, passwordConfirm)` and navigates to `/auth/login`; mismatched passwords show validation error; expired/invalid token shows error with link back to `/auth/login`; form disabled during submission in `src/app/auth/confirm-reset/confirm-reset.spec.ts`
- [X] T020 [US5] Implement `ConfirmResetComponent`: `@Input() token = ''`; new-password + confirm inputs with validation (min 8 chars, match); calls `authService.confirmPasswordReset(token, password, passwordConfirm)`; on success navigates to `/auth/login`; on 400 (expired/used token) displays error message with "Request a new link" navigation to `/auth/login`; form disabled during submission in `src/app/auth/confirm-reset/confirm-reset.ts`

**Checkpoint**: Run `npm test`. All `confirm-reset.spec.ts` tests pass. End-to-end test: request reset from `/auth/login`, check Mailpit inbox (`http://localhost:8025`), follow link to `/auth/confirm-reset?token=...`, set new password, sign in.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T021 [P] Run `npm test` — confirm all 0 failing tests across the full test suite
- [ ] T022 [P] Verify all spec.md acceptance scenarios manually against running app using `quickstart.md` as guide (all P1 user stories + password reset end-to-end via Mailpit)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup) ──────────────────────────────────────────► No dependencies
Phase 2 (Foundational) ──────────────────────────────────► Depends on Phase 1
Phase 3 (US1 Registration) ──────────────────────────────► Depends on Phase 2
Phase 4 (US2 Sign In) ───────────────────────────────────► Depends on Phase 2 (can parallel with Phase 3)
Phase 5 (US3+US4 Sign Out + Protected Access) ───────────► Depends on Phase 2 (can parallel with Phase 3+4)
Phase 6 (US5 Password Reset) ────────────────────────────► Depends on Phase 2 + Phase 4 (LoginComponent has the request form)
Phase 7 (Polish) ────────────────────────────────────────► Depends on all phases complete
```

### User Story Dependencies

- **US1 Registration (Phase 3)**: Depends only on Foundational (Phase 2) — independent
- **US2 Sign In (Phase 4)**: Depends only on Foundational (Phase 2) — independent
- **US3 Sign Out (Phase 5)**: Depends only on Foundational (Phase 2) — independent of US1/US2
- **US4 Protected Access (Phase 5)**: Co-implemented with US3 (shared files) — depends only on Phase 2
- **US5 Password Reset (Phase 6)**: Depends on US2 (LoginComponent contains the request form) + Phases 1+2

### Within Each Phase

- Spec task (`spec.ts`) MUST be written first and confirmed **failing** before implementation
- `npm test` must pass green after each implementation step
- Commit after each task pair (spec + implementation)

### Parallel Opportunities

**Phase 1**: T002 and T003 are independent migration files — run in parallel.

**Phase 2**: T004 + T005 (spec files) run in parallel. T009 + T010 run in parallel after T008.

**Phase 5**: T015 + T016 (spec files for different components) run in parallel. T017 + T018 follow their respective specs.

**Phases 3 + 4 + 5** can all start simultaneously after Phase 2 completes (different components, no shared files).

---

## Parallel Example: After Phase 2 Completes

```
Developer A: Phase 3 (US1) → RegisterComponent
Developer B: Phase 4 (US2) → LoginComponent
Developer C: Phase 5 (US3+US4) → TodoService + TodoListComponent
```

All three work on different files with no conflicts. Phase 6 (US5) starts after Phase 4 is done.

---

## Implementation Strategy

### MVP (US1 + US2 + US3 + US4 — all P1)

1. Complete Phase 1: Backend infrastructure (Mailpit + migrations)
2. Complete Phase 2: AuthService + guards + routing
3. Complete Phase 3: Registration
4. Complete Phase 4: Sign In
5. Complete Phase 5: Sign Out + Protected Access + Data Isolation
6. **STOP and VALIDATE**: Full authentication flow working end-to-end
7. Demo-ready: register, sign in, manage todos, sign out

### Full Delivery (adds P2)

8. Complete Phase 6: Password Reset (with Mailpit end-to-end test)
9. Complete Phase 7: Polish

---

## Notes

- [P] = different files, no dependencies between those specific tasks
- TDD is non-negotiable (constitution Principle III): failing test → minimum implementation → refactor
- `npm test` must pass before marking any task complete
- `authStore.onChange` fires outside the Angular zone — signal mutations in the callback are safe (same pattern as SSE in `todo.service.ts`)
- Migration 2 uses `app.findCollectionByNameOrId('users').id` to resolve the users collection ID dynamically — no hardcoded internal IDs
- The `!` in `pb.authStore.record!.id` (TodoService.create) is safe: the route is behind `authGuard`, so a record is always present when create() is called
