# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at http://localhost:4200 (hot reload)
npm run build      # Production build to dist/
npm run watch      # Dev build with watch mode
npm test           # Run unit tests with Vitest
ng generate component <name>   # Scaffold a new component
```

There is no lint command configured.

## Architecture

This is an Angular 21 + PocketBase proof-of-concept application. PocketBase integration has not yet been implemented — the project is scaffolded and ready for it.

**Key architectural patterns:**
- **Standalone components only** — no NgModules. Every component uses `imports: [...]` directly in its `@Component` decorator.
- **Signals for state** — use Angular `signal()`, `computed()`, and `effect()` for reactive state rather than RxJS subjects where possible.
- **App bootstrap**: `src/main.ts` → `bootstrapApplication(App, appConfig)` where `appConfig` (`src/app/app.config.ts`) holds all root-level providers (router, etc.).
- **Routes**: defined in `src/app/app.routes.ts`, provided via `provideRouter(routes)` in `appConfig`.
- **Styling**: Tailwind CSS v4 imported globally in `src/styles.css` via `@import "tailwindcss"`. PostCSS handles the build via `.postcssrc.json`.
- **Testing**: Vitest (not Karma/Jest). Tests use Angular's `TestBed`. Run a single spec file with `ng test --include src/path/to/file.spec.ts`.

**TypeScript**: Strict mode is fully enabled including `strictTemplates`, `noImplicitOverride`, `noImplicitReturns`, and `noPropertyAccessFromIndexSignature`.

**Prettier config** (in `package.json`): `printWidth: 100`, `singleQuote: true`, Angular parser for HTML files.

## Active Technologies
- TypeScript 5.9, Angular 21.1 + `pocketbase@^0.26.8`, Tailwind CSS v4 (001-pocketbase-todo)
- PocketBase 0.36.4 (SQLite, managed by PocketBase, served via Docker Compose) (001-pocketbase-todo)

## Recent Changes
- 001-pocketbase-todo: Added TypeScript 5.9, Angular 21.1 + `pocketbase@^0.26.8`, Tailwind CSS v4
