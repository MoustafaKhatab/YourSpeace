# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Users epic (addresses)** — customer address CRUD is in place on top of sessionful auth. Next: more user/profile features or Stores/Products.

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- Domain model documented
- Database ERD documented (Mermaid + PNG/PDF)
- Backend folder structure: `routes` → `controllers` → `services` → `rep` → middleware
- Express + Nodemon; `GET /api/health`
- PostgreSQL connection pool + startup `SELECT 1` check
- Schema: `users` (`user_role` enum), `addresses`, `sessions`, `password_reset_codes`
- Auth APIs: register, login, logout, me, forget-password, reset-password
- Address APIs: create, get (list), delete — protected with `sessionAuth` + `authorize('CUSTOMER')`
- Address ownership: create/get/delete use `req.user.user_id` (not client-supplied user id)
- bcrypt + uuid for passwords / session / reset codes
- Session from **`x-session-id` header** (logout, me, sessionAuth, address routes)
- Middleware: `sessionAuth`, `authorize(role)`
- Forget password: by email → `code_verifier` (JSON until Gmail)
- Reset password: transaction (password + delete sessions + mark code used)
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
| Sessionful auth (register/login/logout/me) | Done | auth.*, [api.md](../setup/api.md) |
| Password reset (code + transaction) | Done | `password_reset_codes`, forget/reset |
| Session + role middleware | Done | `session_auth.js`, `authorize.js`, `user_role` |
| User addresses CRUD | Done | address.*, `addresses` table, [api.md](../setup/api.md) |
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
