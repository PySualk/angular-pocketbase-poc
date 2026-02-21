# Feature Specification: User Authentication

**Feature Branch**: `002-user-auth`
**Created**: 2026-02-21
**Status**: Draft
**Input**: User description: "implement user authentication with pocketbases build in features"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Account Registration (Priority: P1)

A new visitor arrives at the application and wants to create an account so they can access their personal todo list. They provide an email address and password, receive a confirmation, and are immediately signed in.

**Why this priority**: Without the ability to create accounts, no other auth feature can be used. Registration is the entry point for all new users.

**Independent Test**: Can be fully tested by visiting the app as an unauthenticated user, completing the registration form, and verifying the user lands on the todo list as a signed-in user.

**Acceptance Scenarios**:

1. **Given** a user is not signed in, **When** they submit a valid email and password on the registration form, **Then** their account is created and they are signed in automatically.
2. **Given** a user submits a registration form, **When** the email address is already in use, **Then** a clear error message is shown and no duplicate account is created.
3. **Given** a user submits a registration form, **When** the password does not meet minimum requirements (at least 8 characters), **Then** a validation error is shown before submission.
4. **Given** a user submits a registration form, **When** the email format is invalid, **Then** a validation error is shown before submission.
5. **Given** a user submits a registration form, **When** the password and confirm password fields do not match, **Then** a validation error is shown before submission.

---

### User Story 2 - Sign In (Priority: P1)

An existing user returns to the application and signs in with their email and password to access their personal todo list.

**Why this priority**: Sign-in is the primary recurring action for all registered users — without it, users cannot access their data.

**Independent Test**: Can be fully tested by creating an account, signing out, signing back in, and verifying the user's todo list is restored.

**Acceptance Scenarios**:

1. **Given** a registered user is not signed in, **When** they submit their correct email and password, **Then** they are signed in and redirected to the todo list (`/`).
2. **Given** a user attempts to sign in, **When** the email or password is incorrect, **Then** a generic error message is shown (without revealing which field is wrong).
3. **Given** a signed-in user, **When** they navigate to the sign-in page, **Then** they are redirected away from it (already authenticated).

---

### User Story 3 - Sign Out (Priority: P1)

A signed-in user wants to end their session so their account is secure, especially on a shared device.

**Why this priority**: Session termination is a fundamental security requirement for any authenticated feature.

**Independent Test**: Can be fully tested by signing in, clicking the sign-out action, and verifying the user is returned to the sign-in page with no access to protected content.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they trigger the sign-out action, **Then** their session is ended and they are redirected to the sign-in page.
2. **Given** a signed-out user, **When** they attempt to navigate directly to the todo list, **Then** they are redirected to the sign-in page.

---

### User Story 4 - Protected Access & Data Isolation (Priority: P1)

The todo list is private to each user — unauthenticated visitors cannot view or interact with any todos, and each user only sees their own data.

**Why this priority**: Data isolation is the core purpose of adding authentication. Without this, auth provides no actual protection.

**Independent Test**: Can be fully tested by creating two separate accounts, adding todos to each, and verifying neither user can see the other's items.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user, **When** they visit any protected page, **Then** they are redirected to the sign-in page.
2. **Given** a signed-in user, **When** they view their todo list, **Then** they only see todos they created.
3. **Given** two separate users each with todos, **When** either user views their list, **Then** they see only their own items.

---

### User Story 5 - Password Reset (Priority: P2)

A returning user has forgotten their password and needs to regain access to their account by receiving a reset link via email.

**Why this priority**: Password reset reduces user lockout and support burden. It is important but not blocking — users can still create new accounts in the short term.

**Independent Test**: Can be fully tested by submitting a known email for password reset, following the emailed link, setting a new password, and verifying sign-in with the new password succeeds.

**Acceptance Scenarios**:

1. **Given** a user on the sign-in page, **When** they request a password reset for a registered email, **Then** a reset email is sent and a success message is shown.
2. **Given** a user on the sign-in page, **When** they request a password reset for an unregistered email, **Then** a generic success message is shown (no enumeration of accounts).
3. **Given** a user who received a reset email, **When** they follow the link, **Then** the app opens a dedicated "set new password" page with the reset token pre-loaded.
4. **Given** a user on the in-app reset confirmation page, **When** they submit a valid new password, **Then** the password is changed and they are redirected to the sign-in page.
5. **Given** a password reset link, **When** it has already been used or has expired, **Then** an error is shown on the confirmation page and the user is prompted to request a new link.

---

### Edge Cases

- What happens when a user's session token expires mid-session? They should be redirected to the sign-in page without data loss.
- What happens when a user submits a registration or sign-in form multiple times rapidly? Only one request should be processed; the form should be disabled during submission.
- What happens when the backend is unreachable during sign-in or registration? A clear connection error is shown and the user is not left in an indeterminate state.
- What happens when a user navigates back after signing out? They remain signed out and cannot access protected content from browser history.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new users to create an account using an email address and password.
- **FR-002**: System MUST authenticate registered users using their email address and password.
- **FR-003**: System MUST allow signed-in users to end their session at any time.
- **FR-004**: System MUST redirect unauthenticated users away from protected pages to the sign-in page (`/auth/login`).
- **FR-004a**: Sign-in and registration MUST be available on separate, dedicated routes (`/auth/login` and `/auth/register` respectively); a password reset confirmation page MUST be available at a third dedicated route (e.g., `/auth/confirm-reset`).
- **FR-005**: System MUST isolate each user's todo data so users can only access their own todos.
- **FR-006**: System MUST display a user-friendly error when sign-in credentials are invalid, without revealing which field (email or password) is incorrect.
- **FR-007**: System MUST validate email format, minimum password length (8 characters), and matching confirm password on the registration form before submission.
- **FR-008**: System MUST allow users to request a password reset email from the sign-in page.
- **FR-009**: System MUST provide a dedicated in-app page (reachable via the reset email link) where the user can set a new password using the token from that link.
- **FR-010**: System MUST preserve the user's signed-in session across page refreshes within the same browser session.
- **FR-011**: System MUST display the current user's identity (email or name) while they are signed in.

### Key Entities

- **User (Account)**: Represents a registered user. Key attributes: unique email address, password (hashed, never exposed), verified status, display name (optional).
- **Session**: Represents an active authentication state for a user. Valid for a defined duration; cleared on sign-out or expiry.
- **Password Reset Request**: A time-limited, single-use token sent to a user's email to authorize setting a new password.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new user can complete registration and arrive at their todo list in under 60 seconds.
- **SC-002**: A returning user can sign in and reach their todo list in under 30 seconds.
- **SC-003**: 100% of unauthenticated direct URL accesses to protected pages result in redirect to the sign-in page.
- **SC-004**: Zero todo items from one user are visible to any other authenticated user.
- **SC-005**: A password reset email is requested and a new password is set successfully in under 3 minutes.
- **SC-006**: The signed-in session persists correctly after a full browser page refresh.

## Clarifications

### Session 2026-02-21

- Q: Is the in-app password reset confirmation page (a dedicated route accepting the reset token) in scope? → A: Yes — the app includes a dedicated route that accepts the reset token from the email link and presents a "set new password" form.
- Q: Auth UI layout — separate routes or single page with toggle? → A: Separate routes — `/auth/login` for sign-in and `/auth/register` for registration, each as a distinct page.
- Q: After successful sign-in, where is the user redirected? → A: Always redirect to the todo list (`/`), regardless of where the user came from.
- Q: Should the registration form include a "confirm password" field? → A: Yes — the user must type their password twice; a validation error is shown if the two entries do not match.
- Q: How should existing todos (created before auth) be handled when user ownership is added? → A: Delete all existing todos — clean slate, no migration of pre-auth data.

## Assumptions

- The application uses a built-in auth collection that provides email/password authentication, password reset, and session management out of the box.
- Email verification (confirming a user owns their email address) is out of scope for this feature — it can be added as a future enhancement.
- OAuth2 / social login (Google, GitHub, etc.) is out of scope for this feature.
- The todos collection will be migrated to enforce user ownership (adding an owner relation field). All existing todos will be deleted as part of this migration — no pre-auth data is preserved. Only the creator can read, update, or delete their own todos.
- Password minimum length of 8 characters aligns with the backend's default minimum.
- Session persistence is limited to the current browser session — sessions survive page refreshes but are not shared across devices.
- A single user role is sufficient — no admin or multi-role authorization is required for this POC.
