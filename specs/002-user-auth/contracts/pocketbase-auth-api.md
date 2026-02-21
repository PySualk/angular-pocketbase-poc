# API Contract: PocketBase Authentication

**Feature**: 002-user-auth
**SDK**: PocketBase JS SDK `^0.26.8`
**Base URL**: `http://localhost:8080` (dev) / configured via `environment.pocketbaseUrl`

---

## 1. Register User

**SDK call**: `pb.collection('users').create(body)`

**Request body**:
```typescript
{
  email: string;          // required, valid email format
  password: string;       // required, min 8 characters
  passwordConfirm: string // required, must match password
}
```

**Success response** (`200`): `RecordModel` — the newly created user record.

**Error cases**:
| HTTP | Condition | UI behaviour |
|------|-----------|--------------|
| 400  | Email already in use | Show "Email already in use" error |
| 400  | Password too short | Show "Password must be at least 8 characters" |
| 400  | Passwords don't match | Show "Passwords do not match" |
| 0    | Network / backend unreachable | Show connection error message |

**Follow-up**: On success, immediately call `authWithPassword` (see §2) to sign the user in.

---

## 2. Sign In (Auth with Password)

**SDK call**: `pb.collection('users').authWithPassword(email, password)`

**Request parameters**:
```typescript
email: string;    // required
password: string; // required
```

**Success response** (`200`):
```typescript
{
  token: string;      // JWT — automatically stored in pb.authStore
  record: RecordModel // authenticated user — automatically stored in pb.authStore
}
```
After success, `pb.authStore.isValid === true` and `pb.authStore.record` holds the user.

**Error cases**:
| HTTP | Condition | UI behaviour |
|------|-----------|--------------|
| 400  | Invalid credentials (any field wrong) | Show generic "Invalid email or password" (do not reveal which field) |
| 0    | Network / backend unreachable | Show connection error message |

---

## 3. Sign Out

**SDK call**: `pb.authStore.clear()`

**Synchronous**. Clears token and record from `authStore` and `localStorage`. No network request. Fires `authStore.onChange` callback.

**Post-logout state**: `pb.authStore.isValid === false`, `pb.authStore.record === null`.

---

## 4. Auth State (Reactive)

**SDK calls**:
```typescript
pb.authStore.isValid                              // boolean (synchronous getter)
pb.authStore.record                               // RecordModel | null (synchronous getter)
pb.authStore.onChange(callback, fireImmediately?) // subscribe to store changes
```

**`onChange` signature**:
```typescript
pb.authStore.onChange(
  (token: string, record: AuthRecord) => void,
  fireImmediately?: boolean  // if true, fires immediately with current state
): () => void  // returns unsubscribe function
```

**Angular integration**: Call with `fireImmediately: true` in the `AuthService` constructor to initialise signals from localStorage-persisted state. Store the returned unsubscribe function and call it in `ngOnDestroy`.

---

## 5. Request Password Reset

**SDK call**: `pb.collection('users').requestPasswordReset(email)`

**Request parameters**:
```typescript
email: string; // required
```

**Success response** (`204`): No body. PocketBase sends a reset email to the address.

**Important**: PocketBase returns `204` even if no account exists for the given email (prevents account enumeration). Always show a generic success message regardless of response.

**Error cases**:
| HTTP | Condition | UI behaviour |
|------|-----------|--------------|
| 0    | Network / backend unreachable | Show connection error message |

---

## 6. Confirm Password Reset

**SDK call**: `pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)`

**Request parameters**:
```typescript
token: string;           // required — from reset email URL query param ?token=...
password: string;        // required, min 8 characters
passwordConfirm: string; // required, must match password
```

**Success response** (`204`): No body. Password updated. All existing auth tokens for the user are invalidated.

**Post-confirm**: Redirect user to `/auth/login` to sign in with the new password.

**Error cases**:
| HTTP | Condition | UI behaviour |
|------|-----------|--------------|
| 400  | Token expired or already used | Show "Reset link has expired. Please request a new one." with a link back to `/auth/login` |
| 400  | Passwords don't match | Show "Passwords do not match" |
| 400  | Password too short | Show "Password must be at least 8 characters" |
| 0    | Network / backend unreachable | Show connection error message |

---

## 7. Todos Collection (Auth-scoped)

No API surface change from the consumer perspective. PocketBase enforces ownership via collection rules (see `data-model.md`). The only change is in `TodoService.create()`:

**Updated `create` payload**:
```typescript
await pb.collection('todos').create({
  title: trimmed,
  completed: false,
  owner: pb.authStore.record!.id,  // NEW — required field
});
```

All other `TodoService` methods (`load`, `toggleTodo`, `deleteTodo`) are unchanged. The `listRule` (`owner = @request.auth.id`) ensures `getList` returns only the current user's todos automatically.
