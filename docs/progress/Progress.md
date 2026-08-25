# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Active: Sprint 4 – Store & Product Management** (22 Aug – 29 Aug)

**On hold: Sprint 3 – Shopping Cart Management** (29 Aug – 5 Sep) — paused while Sprint 4 runs.

| Ticket | Item | Status |
|--------|------|--------|
| SCRUM-33 | Seller Profile Creation | Done |
| SCRUM-34 | Store Creation | Done |
| SCRUM-35 | Store Retrieval | Done |
| SCRUM-36 | Store Update | Done |
| SCRUM-37 | Category Retrieval | To Do (create API done) |
| SCRUM-38 | Product Creation | To Do |
| SCRUM-39 | Product Retrieval | To Do |
| SCRUM-40 | Product Update | To Do |
| SCRUM-41 | Product Variant Creation | To Do |
| SCRUM-42 | Product Variant Management | To Do |
| SCRUM-43 | Product Image Management | To Do |
| SCRUM-44 | Product Category Assignment | To Do |

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- **Schema (Sprint 4)** — `categories` (global tree + unique name per parent), `products`, `product_categories`
- **Category create (global)** — `POST /api/category/create-category`; sellers create shared categories only if name free under same parent; no store ownership
- **SCRUM-36 Store Update** — `PUT /api/store/update-user-store`; partial fields + validation; name uniqueness; `updated_at`
- **SCRUM-35 Store Retrieval** — `GET /api/store/get-user-store`; uses `req.user.seller_id` from `authorize('SELLER')`
- **SCRUM-34 Store Creation** — `POST /api/store/create-store`; `req.user.seller_id` from `authorize('SELLER')` (not from client); name validation; one store per seller
- **SCRUM-33 Seller Profile** — register as SELLER + `GET /api/seller/me`; `authorize('SELLER')` sets `req.user.seller_id`
- **Separate reset verify API** — `POST /api/auth/reset-password/verify-code` (email from body / Gmail flow, no session); `POST /verify-code` is session-only for change-password
- **SCRUM-21 Change password (complete)** — request → verify-code (sets `verified`) → change-password; reset uses `reset-password/verify-code`; HTML templates in `emailTemplates.js`
- Sprint 2: customer profile, address CRUD, logout
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
| Logout | Done | `x-session-id` header |
| Forget / reset password (API + DB) | Done | `forget` → `reset-password/verify-code` → `reset-password` |
| Middleware: `sessionAuth`, `authorize` | Done | `session_auth.js`, `authorize.js` |
| Auth API docs | Done | [api.md](../setup/api.md) |

---

### Sprint 2 – Users

| Item | Status | Artifact |
|------|--------|----------|
| Customer profile retrieval (SCRUM-18) | Done | `GET /api/customer/me` |
| Customer profile update (SCRUM-19) | Done | `PUT /api/customer/me` |
| Address update (SCRUM-20) | Done | `PUT /api/address/update/:address_id` |
| Customer logout (SCRUM-22) | Done | `POST /api/auth/logout` |
| Address create / get / delete | Done | address.*, [api.md](../setup/api.md) |
| Change password (SCRUM-21) | Done | request + session `verify-code` + PUT; reset uses email-only verify |
| Validation and authorization (SCRUM-23) | To Do | — |
| API testing (SCRUM-24) | To Do | — |

---

### Sprint 3 – Shopping Cart Management *(On Hold)*

> Dates: **29 Aug – 5 Sep**. Paused while Sprint 4 (Store & Product) is active.

| Ticket | Item | Status |
|--------|------|--------|
| SCRUM-26 | Implement Cart Retrieval | On Hold |
| SCRUM-27 | Implement Add to Cart | On Hold |
| SCRUM-28 | Implement Cart Item Quantity Update | On Hold |
| SCRUM-29 | Implement Remove from Cart | On Hold |
| SCRUM-30 | Implement Clear Cart | On Hold |
| SCRUM-31 | Test Complete Cart Flow | On Hold |

---

### Sprint 4 – Store & Product Management *(Active)*

> Dates: **22 Aug – 29 Aug**. Current sprint.

| Ticket | Item | Status | Artifact |
|--------|------|--------|----------|
| SCRUM-33 | Seller Profile Creation | Done | register `SELLER` + `GET /api/seller/me`; `authorize` sets `req.user.seller_id` |
| SCRUM-34 | Store Creation | Done | `POST /api/store/create-store`; `stores` table; one store per seller |
| SCRUM-35 | Store Retrieval | Done | `GET /api/store/get-user-store`; by `req.user.seller_id` |
| SCRUM-36 | Store Update | Done | `PUT /api/store/update-user-store`; partial update + uniqueness |
| — | Category create (ahead of SCRUM-37) | Done | `POST /api/category/create-category`; global tree; unique name per parent |
| SCRUM-37 | Category Retrieval | To Do | — |
| SCRUM-38 | Product Creation | To Do | schema: `products`, `product_categories` ready |
| SCRUM-39 | Product Retrieval | To Do | — |
| SCRUM-40 | Product Update | To Do | — |
| SCRUM-41 | Product Variant Creation | To Do | — |
| SCRUM-42 | Product Variant Management | To Do | — |
| SCRUM-43 | Product Image Management | To Do | — |
| SCRUM-44 | Product Category Assignment | To Do | — |

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
