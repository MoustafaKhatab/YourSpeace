# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Authentication epic** — sessionful auth APIs + middleware (`sessionAuth`, `authorize`) are in place; Gmail for reset codes still pending.

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- Domain model documented
- Database ERD documented (Mermaid + PNG/PDF)
- Backend folder structure: `routes` → `controllers` → `services` → `rep` → middleware
- Express + Nodemon; `GET /api/health`
- PostgreSQL connection pool + startup `SELECT 1` check
- Schema: `users` (role enum `user_role`), `sessions`, `password_reset_codes`
- Auth APIs: register, login, logout, me, forget-password, reset-password
- bcrypt + uuid for passwords / session / reset codes
- Session from **`x-session-id` header** (logout, me, sessionAuth) — not request body
- Middleware: `sessionAuth` (expiry + attach `req.user`), `authorize('SELLER'|'ADMIN'|…)`
- Forget password: by email → create `code_verifier` (JSON until Gmail)
- Reset password: transaction (update password + delete sessions + mark code used)
- Docs: Setup, DB, API reference, Progress

---

## Sprint history

### Sprint 0 – Project Foundation

| Item | Status | Artifact |
|------|--------|----------|
| Project vision / marketplace idea | Done | [README](../../README.md) |
| Requirements / Agile process | Done | [Agile.md](../process/Agile.md) |
| Domain model | Done | [Domain_Model.md](../design/Domain_Model.md) |
| Database design / ER diagram | Done | [ERD.md](../design/ERD.md), [ERD.mmd](../design/ERD.mmd), [ERD.png](../design/ERD.png) |
| Backend scaffold + health API | Done | `Backend/` |
| PostgreSQL connection + schema | Done | `Backend/Database/`, [db.md](../setup/db.md) |
| Sessionful auth (register/login/logout/me) | Done | auth routes/controllers/services/rep, [api.md](../setup/api.md) |
| Password reset (code + transaction) | Done | `password_reset_codes`, forget/reset endpoints |
| Session + role middleware | Done | `session_auth.js`, `authorize.js`, `user_role` enum |
| Local setup + API docs | Done | [Setup.md](../setup/Setup.md), [api.md](../setup/api.md) |

---

## How to follow along

| Where | What you see |
|-------|----------------|
| [Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9) | Upcoming sprints, stories, and board status |
| This file (`progress/Progress.md`) | What has landed in the repo |
| [api.md](../setup/api.md) | Current HTTP endpoints |
| [db.md](../setup/db.md) | DB setup and implemented tables |
| [Agile.md](../process/Agile.md) | Scrum process + epic list (stable) |
| Other folders under `docs/` | Finished design/setup artifacts (mostly stable) |
