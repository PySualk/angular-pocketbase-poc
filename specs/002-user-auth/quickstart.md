# Quickstart: User Authentication Feature

**Feature**: 002-user-auth
**Date**: 2026-02-21

---

## Prerequisites

- Docker Compose installed and running
- Node.js 20+ installed
- Repo cloned at `angular-pocketbase-poc/`

---

## 1. Start the Backend (Fresh)

Since this migration drops and recreates the `todos` collection, start PocketBase with a clean data volume. Mailpit starts automatically alongside PocketBase:

```bash
# Wipe existing data and start fresh
docker compose down -v
docker compose up --build
```

| Service | URL | Description |
|---------|-----|-------------|
| PocketBase | `http://localhost:8080` | Backend API + admin UI |
| Mailpit | `http://localhost:8025` | Email inbox for captured outbound emails |

**On first run**, navigate to `http://localhost:8080/_/` to create an admin account.

> **Email is pre-configured**: migration `3_configure_smtp.js` automatically points PocketBase at Mailpit (`mailpit:1025`) and sets the app URL to `http://localhost:4200`. No manual SMTP setup required.

---

## 2. Start the Angular Dev Server

```bash
npm start
```

Angular runs at `http://localhost:4200`.

On first visit, you are redirected to `/auth/login`. Create an account via `/auth/register`.

---

## 4. Run Tests

```bash
npm test
```

All unit tests run via Vitest. Auth-related specs are in:
- `src/app/auth/auth.service.spec.ts`
- `src/app/auth/auth.guard.spec.ts`
- `src/app/auth/login/login.spec.ts`
- `src/app/auth/register/register.spec.ts`
- `src/app/auth/confirm-reset/confirm-reset.spec.ts`

---

## 5. Route Map

| URL | Description | Auth required? |
|-----|-------------|----------------|
| `/` | Todo list | Yes (redirects to `/auth/login`) |
| `/auth/login` | Sign in | No (redirects to `/` if already signed in) |
| `/auth/register` | Create account | No (redirects to `/` if already signed in) |
| `/auth/confirm-reset?token=...` | Set new password | No |

---

## 6. Testing Password Reset End-to-End

Mailpit captures all emails sent by PocketBase. No real email account needed.

1. Go to `http://localhost:4200/auth/login` → click "Forgot password?" → enter your registered email
2. Open **Mailpit** at `http://localhost:8025`
3. Click the captured "Reset password" email
4. Click the reset link in the email body — it opens `http://localhost:4200/auth/confirm-reset?token=...`
5. Enter a new password and confirm
