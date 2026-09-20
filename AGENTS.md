# Project Guidelines

## Project Context

- This is an Angular 22 standalone application for managing salon appointments.
- The UI text and domain terminology are in Spanish; preserve existing names such as `turno`, `profesional`, `servicio` and `cliente`.
- Read [docs/GUIA_DESARROLLO_ANGULAR.md](docs/GUIA_DESARROLLO_ANGULAR.md) for the development workflow and [docs/analisis-funcional.md](docs/analisis-funcional.md) for business rules.

## Architecture

- Keep global concerns in `src/app/core`: models, HTTP services, guards, interceptors, mock data and pure utilities.
- Keep route-level business capabilities in `src/app/features`; keep reusable UI in `src/app/shared`.
- Use standalone components with lazy `loadComponent` routes. Add every template dependency to that component's `imports`.
- Pages coordinate UI state and user actions. HTTP URLs and DTO serialization belong in services, not pages.
- Development API calls are handled by `mock-api.interceptor.ts` and `mock-db.ts`; adding an endpoint generally requires updating both the HTTP service and the mock route.
- The mock is in-memory and resets on reload. Production uses the real API with `mockEnabled: false`.

## Angular Conventions

- Use `inject(...)` and root services with `@Injectable({ providedIn: 'root' })`.
- Use signals for local reactive state and Angular control flow (`@if`, `@for`, `@switch`) in templates.
- Services return typed `Observable<T>` values. Use reactive forms with explicit validators and construct DTOs before submitting.
- Use Angular Material for controls, dialogs, tables, spinners and short feedback via `MatSnackBar`.
- Add `aria-label` to icon-only buttons and keep layouts responsive.
- Put shared interfaces and DTOs in `src/app/core/models` and export them through `models/index.ts`.
- Prefer the aliases `@app/*` and `@env/*` over long relative imports.
- Follow the existing formatting: two spaces, single quotes, final newline and Prettier settings.

## Security Boundaries

- Guards and hidden UI controls improve navigation but are not authorization. The real backend must enforce authentication, roles, ownership and input validation.
- Never add secrets, real credentials or tokens to source code, environment files or mock data.
- Do not treat `localStorage` user data or client-provided IDs as trusted security decisions.

## Validation

Run from the repository root after code changes:

```bash
npm ci
npm run lint
npm test -- --watch=false
npm run build
```

- Add or update focused unit tests for new business rules, especially availability, date handling and state transitions.
- Check production bundle and component-style budgets when adding UI.
- There is currently no configured end-to-end test command; do not assume `ng e2e` is available.

## Git and Documentation

- Use short branches such as `feature/002-agenda`, `fix/003-login` or `docs/004-guide`.
- Use Conventional Commit messages, for example `feat(agenda): add daily appointments view`.
- Do not commit generated output, `node_modules`, caches, coverage files or secrets; keep `package-lock.json` versioned.
- Keep `main` protected through pull requests when repository settings are available.
- Update the relevant document under `docs/` instead of duplicating architecture or business rules in this file.