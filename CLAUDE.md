# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

This is a Bun monorepo with three packages: `shared`, `server`, and `web`.

```bash
bun install                # Install dependencies
bun run dev                # Start all packages in watch mode (server:3000 + web:5173)
bun run dev:server         # Start server only (port 3000, Bun --watch)
bun run dev:web            # Start web frontend only (port 5173, Vite)
bun run build              # Build all packages
bun run typecheck          # Type check all packages
```

No test framework is configured yet. No linter is configured.

## Architecture

Devgentic orchestrates AI-powered development workflows using Claude Code agents. Users create sessions that progress through a pipeline: **create → prompt → spec → review → execute**. Each phase uses a different agent role with specific tool permissions.

### Packages

- **@devgentic/shared** (`packages/shared`) — Zod schemas, TypeScript types, and constants shared between server and web. No build step; consumed directly via `src/index.ts`.
- **@devgentic/server** (`packages/server`) — Hono API on Bun runtime with SQLite (WAL mode). Handles repo management, agent orchestration, git operations, and GitHub PR creation.
- **@devgentic/web** (`packages/web`) — React SPA with Vite, TanStack Router, TanStack React Query, Tailwind CSS 4, and shadcn/ui (new-york style, Lucide icons). Sessions are stored client-side in IndexedDB.

### Agent System

The server uses `@anthropic-ai/claude-code` `query()` API to run agents. Each agent role has a system prompt and allowed tools defined in `packages/server/src/services/agent.ts`:

- **promptBuilder**: Read-only tools (Read, Glob, Grep) — helps refine task descriptions
- **specGenerator, specFixer, implementer, validator, documenter**: Full tools (+ Write, Edit, Bash)

Agent results stream to the client via SSE (Server-Sent Events). Event types: `text`, `tool_use`, `tool_result`, `status`, `done`, `error`, `branch_created`, `pr_created`, `phase_complete`.

### API Tokens

API tokens (Z.ai, GitHub, E2B) are stored server-side in the SQLite `settings` table. The API is unauthenticated — no tokens are sent from the browser. Settings are managed via:
- `GET /api/settings` — returns masked token values
- `PUT /api/settings` — stores/updates tokens

### Git Workflow

Repos are cloned to `~/.devgentic/repos/{repoId}`. Branches follow the convention `devgentic/spec-{sessionId}` and `devgentic/exec-{sessionId}`. PRs are created via Octokit.

### Web Frontend Conventions

- Path alias: `@/` maps to `packages/web/src/`
- UI components in `components/ui/` are shadcn/ui (install via `npx shadcn@latest add <component>` from `packages/web/`)
- API calls go through `lib/api.ts`; SSE streaming through `lib/sse.ts` and `hooks/use-agent-stream.ts`
- Vite proxies `/api` requests to `http://localhost:3000` in dev

### Database

SQLite in WAL mode. Schema defined in `packages/server/src/db/schema.ts`. Tables: `repos` (status tracking: `pending`, `cloning`, `ready`, `error`) and `settings` (key-value store for API tokens). Database file: `devgentic.db` in server working directory.
