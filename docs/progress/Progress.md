# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Auth foundation (sessionful)** — register / login / logout / forget + reset password in place; email delivery for reset codes still pending.

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- Domain model documented
- Database ERD documented (Mermaid + PNG/PDF)
- Backend folder structure: `routes` → `controllers` → `services` → `rep`
- Express + Nodemon; `GET /api/health`
- PostgreSQL connection pool + startup `SELECT 1` check
- Schema tables: `users`, `sessions`, `password_reset_codes` (`npm run db`)
- Auth APIs: register, login, logout, forget-password, reset-password
- bcrypt password hashing + uuid session/reset tokens
- Logout: find user by `session_id`, delete that session
- Forget password: JOIN session→user, create `code_verifier` (returned in JSON until Gmail)
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
| Sessionful auth (register/login/logout) | Done | `src/routes|controllers|services|rep` auth.*, [api.md](../setup/api.md) |
| Password reset (code + transaction) | Done | `password_reset_codes`, forget/reset endpoints |
| Local setup + API docs | Done | [Setup.md](../setup/Setup.md), [api.md](../setup/api.md) |

---

## How to follow along

| Where | What you see |
|-------|----------------|
| [Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9) | Upcoming sprints, stories, and board status |
| This file (`progress/Progress.md`) | What has landed in the repo |
| [api.md](../setup/api.md) | Current HTTP endpoints |
| [db.md](../setup/db.md) | DB setup and implemented tables |
| Other folders under `docs/` | Finished design/setup artifacts (mostly stable) |
