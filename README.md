# Calendar

A calendar app with a React + TypeScript frontend and an Express + Prisma backend.

## Project layout

- `frontend/src/components` — calendar views and reusable UI.
- `frontend/src/hooks` — frontend state and API loading hooks.
- `frontend/src/lib/api.ts` — shared Axios client for `/api` requests.
- `frontend/src/types` and `frontend/src/utils` — shared calendar types and date helpers.
- `backend/src/routes` — HTTP endpoints grouped by resource.
- `backend/src/controllers` — authentication request handlers.
- `backend/src/middlewares` — authentication and request middleware.
- `backend/prisma/schema.prisma` — database models and relations.
- `backend/prisma/migrations` — ordered, committed database schema changes.

## First-time setup

Requirements: Node.js with npm and a running PostgreSQL database.

1. Install each app's dependencies:

   ```sh
   npm install --prefix frontend
   npm install --prefix backend
   ```

2. Copy `.env.example` to `backend/.env` and set `DATABASE_URL`, a private `JWT_SECRET`, and `FRONTEND_ORIGIN` for your frontend host.
3. Apply existing database migrations and generate Prisma Client:

   ```sh
   npm run db:deploy
   npm run prisma:generate
   ```

4. Start the backend and frontend in separate terminals:

   ```sh
   npm run dev:backend
   npm run dev:frontend
   ```

The frontend is served by Vite and proxies `/api` requests to `http://localhost:5000`.

## Common commands

Run commands from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run dev:frontend` | Start the Vite development server. |
| `npm run dev:backend` | Start the Express server with file watching. |
| `npm run build:frontend` | Type-check and build the frontend. |
| `npm run lint:frontend` | Lint frontend source. |
| `npm run typecheck:backend` | Type-check backend source. |
| `npm run prisma:validate` | Validate the Prisma schema. |
| `npm run prisma:generate` | Generate Prisma Client from the schema. |
| `npm run db:migrate` | Create/apply a development migration. |
| `npm run db:deploy` | Apply committed migrations to an existing database. |

## Working with database changes

Update `backend/prisma/schema.prisma`, then run `npm run db:migrate` and give the migration a descriptive name when prompted. Commit the generated migration alongside the schema change. Use `npm run db:deploy` to apply committed migrations in an existing or production database.

Keep API request/response types in sync with `frontend/src/types/calendar.ts` and the Prisma models. Date-only values use `YYYY-MM-DD`; clock times use `HH:mm` strings.

## Conventions

- Keep resource endpoints under `backend/src/routes` and authentication handlers under `backend/src/controllers`.
- Use camelCase for TypeScript values and PascalCase for React components and Prisma models.
- Reuse the shared frontend `api` client so auth headers and the API base path stay consistent.
- Keep date conversion and calendar display rules in `frontend/src/utils/calendarDates.ts` rather than duplicating them in views.
- Store secrets in `backend/.env`; never commit real environment values.
