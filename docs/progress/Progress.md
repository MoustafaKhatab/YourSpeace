# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Sprint 0 – Project Foundation** (wrapping up / transitioning)

- Backend scaffold is running with a health API
- PostgreSQL is connected (`yourspeace`); schema apply via `npm run db`
- Design artifacts for domain and database are documented in `docs/`

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- Domain model documented
- Database ERD documented (Mermaid + PNG/PDF)
- Backend folder structure (`routes` → `controllers` → `services`)
- Express + Nodemon setup; `GET /api/health`
- PostgreSQL connection pool (`Backend/Database/connection.js`)
- Initial schema (`users` table) + `npm run db` to apply `schema.sql`
- Server startup DB check (`SELECT 1` before listen)
- Database setup docs ([db.md](../setup/db.md))
- Setup guide and Postman for API testing
- Docs split: stable phase docs vs this living progress log
- Docs organized into `progress/`, `process/`, `design/`, and `setup/`

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
| Local setup docs | Done | [Setup.md](../setup/Setup.md) |

---

## How to follow along

| Where | What you see |
|-------|----------------|
| [Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9) | Upcoming sprints, stories, and board status |
| This file (`progress/Progress.md`) | What has landed in the repo |
| Other folders under `docs/` | Finished design/setup artifacts (mostly stable) |
