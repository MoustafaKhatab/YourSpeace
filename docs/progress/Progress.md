# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Sprint 2 – Users** — change password via Gmail reset is Done. Still To Do:

| Ticket | Item | Status |
|--------|------|--------|
| SCRUM-23 | Validation and authorization for these operations | To Do |
| SCRUM-24 | API testing | To Do |

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- **SCRUM-21 Change password** — forget-password emails `code_verifier` via Gmail (Nodemailer); reset-password still applies the new password
- Sprint 2: customer profile retrieval/update, address CRUD, logout
- Sprint 1: sessionful auth, session/role middleware
- Sprint 0: foundation, domain/ERD, backend scaffold, PostgreSQL

---

## Sprint history

### Sprint 0 – Project Foundation

| Item | Status | Artifact |
|------|--------|----------|
| Project vision / marketplace idea | Done | [README](../../README.md) |
| Requirements / Agile process | Done | [Agile.md](../process/Agile.md) |
| Domain model | Done | [Domain_Model.md](../design/Domain_Model.md) |
| Database design / ER diagram | Done | [ERD.md](../design/ERD.md), [ERD.mmd](../design/ERD.mmd), [ERD.png](../design/ERD.png) |
| Backend scaffold + health API | Done | `Backend/`, `GET /api/health` |
| PostgreSQL connection + schema apply | Done | `Backend/Database/`, [db.md](../setup/db.md) |
| Local setup docs | Done | [Setup.md](../setup/Setup.md) |

---

### Sprint 1 – Authentication

| Item | Status | Artifact |
|------|--------|----------|
| Schema: `users`, `sessions`, `password_reset_codes`, `user_role` | Done | `schema.sql`, [db.md](../setup/db.md) |
| Register / login (sessionful) | Done | auth routes/services/rep |
| Logout + `GET /auth/me` | Done | `x-session-id` header |
| Forget / reset password (API + DB) | Done | `password_reset_codes` |
| Middleware: `sessionAuth`, `authorize` | Done | `session_auth.js`, `authorize.js` |
| Auth API docs | Done | [api.md](../setup/api.md) |

---

### Sprint 2 – Users

| Item | Status | Artifact |
|------|--------|----------|
| Customer profile retrieval (SCRUM-18) | Done | `GET /api/auth/me` |
| Customer profile update (SCRUM-19) | Done | `PUT /api/customer/me` |
| Address update (SCRUM-20) | Done | `PUT /api/address/update/:address_id` |
| Customer logout (SCRUM-22) | Done | `POST /api/auth/logout` |
| Address create / get / delete | Done | address.*, [api.md](../setup/api.md) |
| Change password (SCRUM-21) | Done | Gmail on forget-password; `POST /auth/verify-code` (session) for change-password step |
| Validation and authorization (SCRUM-23) | To Do | — |
| API testing (SCRUM-24) | To Do | — |

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
