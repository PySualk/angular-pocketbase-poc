# Research Notes: User Authentication

**Feature**: 002-user-auth
**Date**: 2026-02-21
**Status**: Complete — all unknowns resolved

---

## Decision 1: Auth Guard Pattern

**Decision**: Functional `CanActivateFn` guards — two guards co-located in `src/app/auth/auth.guard.ts`.

- `authGuard`: returns `true` if `AuthService.isAuthenticated()` is truthy, otherwise returns `router.createUrlTree(['/auth/login'])`.
- `guestGuard`: returns `router.createUrlTree(['/'])` if already authenticated, otherwise `true`. Applied to `/auth/login` and `/auth/register` routes.

**Rationale**: Angular 21 recommends functional guards over class-based ones. `inject()` gives access to services. Co-locating both guards in one file follows KISS — they are small, closely related, and have no reason to be separated.

**Alternatives considered**: Class-based `CanActivate` — rejected (deprecated, more boilerplate).

---

## Decision 2: AuthService Reactive State

**Decision**: Single `currentUser = signal<RecordModel | null>(pb.authStore.record)` driven by `pb.authStore.onChange(callback, true)`. `isAuthenticated = computed(() => currentUser() !== null)`.

**Rationale**:
- `pb.authStore.onChange(callback, fireImmediately: true)` fires immediately with the current store state, initialising signals correctly on app load (handles localStorage-persisted sessions).
- Return value of `onChange` is a `() => void` unsubscribe function — stored and called in `ngOnDestroy`.
- Deriving `isAuthenticated` from `currentUser()` (rather than `pb.authStore.isValid`) keeps the reactive graph inside signals. When a 401 clears the store, `onChange` fires, `currentUser` becomes null, and `isAuthenticated` becomes false reactively.
- `pb.authStore.isValid` is synchronous — safe to call directly in guards where signals are not needed.

**Alternatives considered**: Using `pb.authStore.isValid` directly in a `computed` — rejected because `isValid` is not a signal, so the computed would not update reactively.

---

## Decision 3: Session Persistence

**Decision**: Accept PocketBase SDK default — `LocalAuthStore` persists the JWT token to `localStorage` under the key `pocketbase_auth` automatically.

**Rationale**: No configuration needed. Sessions survive page refresh within the same browser. This satisfies FR-010 and SC-006 at zero cost.

**Alternatives considered**: `AsyncAuthStore` or custom store — rejected (no requirement beyond page-refresh persistence for this POC).

---

## Decision 4: Registration Flow

**Decision**: Two-step: `pb.collection('users').create({email, password, passwordConfirm})` followed immediately by `pb.collection('users').authWithPassword(email, password)`.

**Rationale**: PocketBase's `create()` on an auth collection does not auto-authenticate. A second `authWithPassword` call signs the user in immediately after registration (satisfying User Story 1 acceptance scenario 1: "signed in automatically").

**Alternatives considered**: OAuth2 — out of scope per spec Assumptions.

---

## Decision 5: Todos Collection Migration Strategy

**Decision**: Migration `2_add_user_auth_to_todos.js` drops the existing `todos` collection and recreates it with an `owner` relation field pointing to `users`, plus auth-scoped rules. All existing todo data is discarded (clean slate per clarification Q5).

**Rationale**: Simplest migration path. Adding an owner field to an existing collection requires marking it required, which would fail for existing ownerless rows. Dropping and recreating avoids complex data patching for a POC.

**Collection rules after migration**:
```
listRule:   owner = @request.auth.id
viewRule:   owner = @request.auth.id
createRule: @request.auth.id != ""
updateRule: owner = @request.auth.id
deleteRule: owner = @request.auth.id
```

**TodoService changes required**: Add `owner: pb.authStore.record!.id` to `create()` payload. The `load()` query and SSE subscription require no changes — server-side rules enforce ownership automatically.

**Alternatives considered**: `ALTER`-style migration that adds the field to existing rows — rejected (clean slate is simpler and correct for a POC).

---

## Decision 6: Password Reset Confirmation Route

**Decision**: Dedicated route `/auth/confirm-reset` with `ConfirmResetComponent`. Token is passed as a query parameter `?token=...` in the reset email link. Component reads token via Angular's `withComponentInputBinding()` + `@Input() token = ''`.

**Rationale**: `withComponentInputBinding()` (added to `provideRouter`) automatically binds query params to component `@Input()` properties — cleaner than injecting `ActivatedRoute`. The token query-param approach matches PocketBase's email template format.

**Password reset email template**: The PocketBase admin must configure the Application URL to `http://localhost:4200` (dev) so reset emails contain the correct link. See `quickstart.md` for the one-time setup step.

**Alternatives considered**: Path param (e.g., `/auth/confirm-reset/:token`) — rejected; query params are the conventional approach for tokens in reset flows.

---

## Decision 7: App Component Restructuring

**Decision**: `App` component becomes a thin shell — `template: '<router-outlet />'` only. `RouterOutlet` added to `imports`. All logic moves to route-specific components.

**Rationale**: With Angular Router handling navigation, `App` has no business logic. The current `todoService.load()` call in `App.ngOnInit` moves to `TodoListComponent.ngOnInit` — the component that actually needs the data.

**BackendErrorComponent**: Reused by `TodoListComponent` for backend-unreachable scenarios. Auth pages show inline error messages instead (no full-screen error for auth failures).

---

## Decision 9: Local Email Testing

**Decision**: Add Mailpit (`axllent/mailpit`) to `docker-compose.yml`. Configure PocketBase SMTP to point at `mailpit:1025` via a dedicated migration (`3_configure_smtp.js`). Set app URL to `http://localhost:4200` and password reset action URL to `{APP_URL}/auth/confirm-reset` in the same migration.

**Rationale**: Mailpit captures all outbound SMTP traffic and exposes a web inbox at `http://localhost:8025`. This makes the password reset flow fully testable end-to-end in a single `docker compose up` — no real SMTP credentials, no log-grepping for tokens. The migration approach automates the configuration so there are zero manual setup steps.

**Alternatives considered**: Grepping PocketBase server logs for the raw token — rejected (brittle, developer-unfriendly, not visible to non-CLI users). Manual SMTP admin UI setup — rejected (not reproducible, breaks on `docker compose down -v`).

---

## Decision 8: Route Input Binding

**Decision**: Add `withComponentInputBinding()` to `provideRouter(routes, withComponentInputBinding())` in `app.config.ts`.

**Rationale**: Allows `ConfirmResetComponent` to receive `token` as `@Input()` directly from the query string without injecting `ActivatedRoute`. Cleaner, aligns with Angular 21 idioms.
