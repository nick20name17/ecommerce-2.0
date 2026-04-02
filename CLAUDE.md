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

After every `git push`, check Railway deployment:
1. Wait ~30s for the build to start
2. Run `railway logs --service front` to check if the deploy succeeded or failed
3. If it failed, read the error logs and fix before moving on

## Dev

- `bun run dev` — start dev server on port 3000
- `bun run build` — type check + production build
- `bun run test` — run vitest

## Stack

- React 19 + TypeScript + TanStack Router + TanStack Query
- Tailwind v4, shadcn/ui, Vite + Bun
- API: `src/api/{entity}/` with schema.ts, service.ts, query.ts
- Routes: `src/routes/_authenticated/{entity}/index.tsx`
