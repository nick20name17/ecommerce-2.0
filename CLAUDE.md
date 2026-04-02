# Project: ecommerce-2.0

## Git

- **Repo**: `nick20name17/ecommerce-2.0`
- **Push account**: `eaglesoftwarecanada` — before pushing, ensure correct account: `gh auth switch --user eaglesoftwarecanada`
- Do NOT push with `slooonshop` (pull-only access)

## Railway

- **Workspace**: rivnetech
- **Project**: ecommerce-2.0
- **Environment**: production
- Logs: `railway logs --service front` (frontend), `railway logs --service back` (API)
- Services: front, back, celery, celery beat, Postgres, Redis

## After Push

After every `git push`, you MUST verify the Railway build:
1. Run `bun run build` locally BEFORE pushing — if tsc fails, Railway will fail too
2. After pushing, wait ~60s then run `railway logs --service front --build 2>&1 | tail -20`
3. If `railway logs --build` still shows old build, the new one likely failed — check the Railway dashboard URL
4. NEVER move on to the next task until you've confirmed the build passed
5. If build fails, fix the error and push again immediately

**IMPORTANT**: `railway logs --build` only shows the LAST SUCCESSFUL build. Failed builds are only visible in the Railway dashboard. So always run `bun run build` locally first as the source of truth.

**NEVER run `railway up`** — deployments are triggered automatically via GitHub push. Running `railway up` creates a separate CLI deployment that blocks the queue.

## Dev

- `bun run dev` — start dev server on port 3000
- `bun run build` — type check + production build
- `bun run test` — run vitest

## Stack

- React 19 + TypeScript + TanStack Router + TanStack Query
- Tailwind v4, shadcn/ui, Vite + Bun
- API: `src/api/{entity}/` with schema.ts, service.ts, query.ts
- Routes: `src/routes/_authenticated/{entity}/index.tsx`
