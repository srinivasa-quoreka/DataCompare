# Data Compare v2

Production rewrite of the legacy `FT_Validator_Standalone.html` (~6,950 lines, single file) into a maintainable, multi-user platform. No LLM dependency, no API keys to buy.

## What changed vs. v1

| Concern | v1 (legacy) | v2 (this repo) |
|---|---|---|
| Frontend | Single HTML file, vanilla JS | Next.js 14 + React 18 + TypeScript + Tailwind |
| State / data | `localStorage` per browser | PostgreSQL (Prisma ORM), shared across users |
| Backend | Static `server.js` | NestJS REST API with JWT auth, RBAC, rate limiting |
| Auth | Hard-coded credentials in JS | bcrypt-hashed passwords in DB, JWT, change-password flow |
| Deploy | Double-click `.bat` | `docker compose up` on the same Windows server (port 5000 preserved) |
| Code reuse | None | `@data-compare/shared` package — `cvApi`, `cvApp`, `resolveFullPath`, `parseMappingRows` shared by web + api |

The three modules from v1 are preserved 1:1 in the UI: **Metal APIs**, **Reconciliation**, **XML Diff**.

## Repo layout

```
data-compare-v2/
  apps/
    web/         Next.js frontend (port 3000)
    api/         NestJS backend (port 3001)
  packages/
    shared/      Pure-TS algorithms (cvApi, cvApp, paths, mapping) used by both apps
  infra/
    docker/      docker-compose.yml (web + api + postgres + nginx)
    nginx/       Reverse proxy config — exposes everything on legacy port 5000
    scripts/     Windows .bat launchers
  .env.example   Copy to .env and fill in
```

## Architecture

```
                +----------------+
 Browser  --->  | nginx :5000    |  reverse proxy (preserves legacy URL)
                +-------+--------+
                        |
              +---------+---------+
              |                   |
       +------v------+      +-----v------+
       | web :3000   |      | api :3001  |
       | Next.js     |----> | NestJS     |
       +-------------+      +-----+------+
                                  |
                          +-------v-------+
                          | postgres :16  |
                          +---------------+
```

## Quick start (dev)

Prerequisites: Node 20+, pnpm 9+, Docker Desktop.

```bash
cp .env.example .env
# edit .env — at minimum set JWT_SECRET and POSTGRES_PASSWORD

pnpm install
docker compose -f infra/docker/docker-compose.yml --env-file .env up -d postgres
pnpm db:generate
pnpm db:migrate
pnpm --filter @data-compare/api prisma:seed   # seeds the legacy default users
pnpm dev                                       # web on :3000, api on :3001
```

Open http://localhost:3000 and log in with `admin` / `Admin123!` (rotate immediately).

## Deploy to the existing Windows server

The legacy app runs at `http://172.16.0.140:5000`. v2 keeps that exact URL via the nginx container.

```cmd
git clone https://github.com/srinivasa-quoreka/DataCompare.git data-compare-v2
cd data-compare-v2
copy .env.example .env
notepad .env                          REM fill in JWT_SECRET, POSTGRES_PASSWORD

infra\scripts\Start-DataCompare.bat   REM brings up postgres, api, web, nginx
infra\scripts\First-Time-Setup.bat    REM one-time: migrate DB + seed users
```

After it's up: `http://172.16.0.140:5000` → same URL the team already uses.

## Adding a new validation type

This is the workflow that pays back the upfront setup cost — adding a fourth module is a small, isolated change rather than a thousand-line edit to a single HTML file.

1. **Backend** — create `apps/api/src/<your-module>/` with `*.module.ts`, `*.service.ts`, `*.controller.ts`. Register the module in `app.module.ts`.
2. **Database** — add the new entity to `apps/api/prisma/schema.prisma`. Run `pnpm db:migrate` to generate and apply the migration.
3. **Shared algorithms** — if you have new normalization or comparison logic, put it in `packages/shared/src/` so both apps import the same code.
4. **Frontend** — create `apps/web/src/app/(app)/<your-module>/page.tsx`. Add it to the `NAV` array in `app-shell.tsx`.

The shared types in `packages/shared/src/types.ts` are the contract. Add the new type there and both ends pick it up at compile time.

## Migration path from the single-file HTML

The legacy app stores everything in `localStorage`. To migrate:

1. Have each user log in to the legacy app and export their `localStorage.dc.data` JSON via the browser console.
2. POST it to `/api/admin/import-legacy` (TODO endpoint — to be implemented).
3. The importer maps `data.stories` (a keyed object) into the `Story` table, preserves keys, re-hashes passwords, and links uploaded files into `FileUpload`.

Until the importer is wired, users can re-create stories through the UI — the data model is a strict superset of v1.

## Default credentials (seeded)

| Username | Password | Role |
|---|---|---|
| `superadmin` | `SuperAdmin@123!` | superadmin |
| `admin` | `Admin123!` | admin |
| `user1`–`user4` | `User1Pass!`–`User4Pass!` | user |

**Rotate immediately after first login.**

## Security notes

- All passwords stored as bcrypt hashes (cost 12).
- JWT signing secret comes from `JWT_SECRET` — generate with `openssl rand -base64 64`.
- CORS is restricted to `CORS_ORIGIN` (comma-separated allowlist).
- Rate limiting via `@nestjs/throttler` (120 req/min per IP, tunable in `app.module.ts`).
- File uploads land outside the web root; only the API serves them via authenticated routes.
- `helmet` is on in production.

## Verifying the build

```bash
pnpm install
pnpm -r run build
pnpm -r run lint
```

CI should run these plus `pnpm test` (unit tests for `@data-compare/shared` algorithms).

## Roadmap (post-scaffold)

- File-upload endpoints + multipart handling (currently the modules expect `FileUpload` rows to exist — wire `multer` into a `FilesController`).
- Story-detail page UI (5-step wizard) — backend is ready, frontend page is a stub.
- Reconciliation wizard UI (the legacy step bar + column-mapping grid).
- XML Diff wizard UI.
- Background job runner (BullMQ + Redis) so long-running reconciliations don't block the request thread.
- Audit-log viewer in admin.
- Legacy data importer endpoint.
