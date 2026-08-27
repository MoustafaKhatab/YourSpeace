# Progress

> **Living document** — update this file as work lands in the repo.
> For upcoming sprints, backlog, and board status, follow **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**.

---

## Current focus

**Active: Sprint 4 – Store & Product Management** (22 Aug – 29 Aug)

**On hold: Sprint 3 – Shopping Cart Management** (29 Aug – 5 Sep) — paused while Sprint 4 runs.

### Working agreement (26 Aug 2026)

1. **Admin + Seller first** — make both roles solid before deep customer / home / cart / order work.
2. **Admin:** account + category management owned by ADMIN — Done.
3. **Seller catalog:** product create/update with required variants (txn category) — Done; next images (and dedicated variant APIs if needed).
4. **Later:** Customer flows, home-page display detail, cart, orders.

| Ticket | Item | Status |
|--------|------|--------|
| SCRUM-33 | Seller Profile Creation | Done |
| SCRUM-34 | Store Creation | Done |
| SCRUM-35 | Store Retrieval | Done |
| SCRUM-36 | Store Update | Done |
| SCRUM-37 | Category Retrieval | Done (`GET /get-categories` public) |
| — | **Admin account + category admin APIs** | **Done** |
| SCRUM-38 | Product Creation | Done (SELLER\|ADMIN; txn + category_id + required variants) |
| SCRUM-39 | Product Retrieval | Done (feed / by-id / by-store / by-category; includes variants) |
| SCRUM-40 | Product Update | Done (SELLER own store \| ADMIN any; category + variants replace txn) |
| SCRUM-41 | Product Variant Creation | Done (on create-product; ≥1 variant required) |
| SCRUM-42 | Product Variant Management | Done (replace via update-product `variants`) |
| SCRUM-43 | Product Image Management | To Do |
| SCRUM-44 | Product Category Assignment | Done (on create/update via `product_categories` txn) |

**Jira Board**

> 🔗 **[View Project Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)**

---

## Latest completed

- **Product variants** — `product_variants` (color, size, stock, price); create requires ≥1 variant; update omit = keep / array = replace (non-empty); public reads include `variants[]`; SCRUM-41/42 done
- **Product create/update (SELLER|ADMIN)** — transactional `products` + `product_categories` + variants; `category_id` from client; public `get-product/:id` + by-store; SCRUM-40 done
- **Admin role** — `admins` table; `POST /api/admin/create-admin` (bootstrap first / ADMIN later); `GET|PUT /api/admin/me`; `authorize('ADMIN')` sets `admin_id`
- **Category management → ADMIN** — create / get-by-id / update / delete require ADMIN; public `GET /get-categories` unchanged
- **Main-page product feed** — public `GET /api/product/get-products` (newest visible products, optional `limit`/`offset`, includes `store_name` + categories)
- **By-category includes subtree** — `GET /api/product/by-category/:category_id` uses `WITH RECURSIVE` (parent + visible descendants); product lists join category `id` + `name`
- **One category per product** — unique index on `product_categories.product_id`; set/clear on create or update (transactional)
- **SCRUM-39 Product retrieval** — public get-product / get-products / by-store / by-category
- **Schema (Sprint 4)** — `admins`, `categories` (global tree), `products`, `product_categories`
- **Category management** — ADMIN CRUD; public visible list only
- **SCRUM-36 Store Update** — `PUT /api/store/update-user-store`
- **SCRUM-35 Store Retrieval** — `GET /api/store/get-user-store`
- **SCRUM-34 Store Creation** — `POST /api/store/create-store`
- **SCRUM-33 Seller Profile** — register as SELLER + `GET /api/seller/me`
- **Separate reset verify API** — `POST /api/auth/reset-password/verify-code`
- **SCRUM-21 Change password** — request → verify-code → change-password
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
| — | Category create | Done | `POST /api/category/create-category`; **ADMIN** only; unique name per parent |
| SCRUM-37 | Category Retrieval | Done | `GET /api/category/get-categories` (public, visible only); admin get/update/delete |
| SCRUM-38 | Product Creation | Done | SELLER\|ADMIN; txn product + category + variants (≥1) |
| SCRUM-39 | Product Retrieval | Done | public get-product / get-products / by-store / by-category (+ variants) |
| SCRUM-40 | Product Update | Done | SELLER own store \| ADMIN any; category + variants replace txn |
| SCRUM-41 | Product Variant Creation | Done | required `variants[]` on create-product |
| SCRUM-42 | Product Variant Management | Done | replace via update-product `variants` (omit keeps) |
| SCRUM-43 | Product Image Management | To Do | — |
| SCRUM-44 | Product Category Assignment | Done | create/update via `product_categories` txn |

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
