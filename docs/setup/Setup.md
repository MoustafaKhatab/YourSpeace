# Setup

Brief guide for running the project so far.

---

## Tech Stack (so far)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Dev server | Nodemon |
| Database | PostgreSQL (`pg`) |
| Password hashing | bcrypt |
| IDs / tokens | uuid |
| Email | Nodemailer + Gmail (App Password) |
| API testing | Postman |
| Planned later | Prisma, Docker, Redis, RabbitMQ |

---

## Prerequisites

- Node.js (LTS recommended)
- npm
- PostgreSQL (see [db.md](db.md))

---

## Backend setup

```bash
cd Backend
npm install
cp .env.example .env   # edit DB_* and GMAIL_* 
npm run db             # apply schema (… sellers, admins, stores, categories, products, product_categories)
npm run dev
```

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start server with Nodemon (auto-reload) |
| `npm start` | Start server with Node |
| `npm run db` | Apply `Database/schema.sql` to PostgreSQL |

### Gmail (reset / change-password codes)

Emails use Nodemailer + HTML templates in `src/utils/emailTemplates.js`.  
- `forget-password` → `forgetPassword` template  
- `change-password/request` → `changePassword` template (session user’s email only)  
- after successful change → `passwordChanged` template  

In `Backend/.env`:

```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
```

Use a Google [App Password](https://myaccount.google.com/apppasswords) (2FA on), not your normal Gmail password. Helper: `src/utils/mailer.js`.

- Database guide: **[db.md](db.md)**
- API reference: **[api.md](api.md)**

Server default: `http://localhost:3000`

### Quick checks

```text
GET    http://localhost:3000/api/health
POST   http://localhost:3000/api/auth/register
POST   http://localhost:3000/api/auth/login
POST   http://localhost:3000/api/auth/forget-password
POST   http://localhost:3000/api/auth/reset-password/verify-code
POST   http://localhost:3000/api/auth/reset-password
POST   http://localhost:3000/api/auth/change-password/request
POST   http://localhost:3000/api/auth/verify-code
PUT    http://localhost:3000/api/auth/change-password
GET    http://localhost:3000/api/customer/me
PUT    http://localhost:3000/api/customer/me
GET    http://localhost:3000/api/seller/me
POST   http://localhost:3000/api/admin/create-admin
GET    http://localhost:3000/api/admin/me
PUT    http://localhost:3000/api/admin/me
POST   http://localhost:3000/api/store/create-store
GET    http://localhost:3000/api/store/get-user-store
PUT    http://localhost:3000/api/store/update-user-store
POST   http://localhost:3000/api/category/create-category
GET    http://localhost:3000/api/category/get-category/:category_id
PUT    http://localhost:3000/api/category/update-category/:category_id
DELETE http://localhost:3000/api/category/delete-category/:category_id
GET    http://localhost:3000/api/category/get-categories
POST   http://localhost:3000/api/product/create-product
PUT    http://localhost:3000/api/product/update-product/:product_id
GET    http://localhost:3000/api/product/get-product/:product_id
GET    http://localhost:3000/api/product/get-products
GET    http://localhost:3000/api/product/by-store/:store_name
GET    http://localhost:3000/api/product/by-category/:category_id
POST   http://localhost:3000/api/address/create
GET    http://localhost:3000/api/address/get
PUT    http://localhost:3000/api/address/update/:address_id
DELETE http://localhost:3000/api/address/delete/:address_id
```

Protected with `x-session-id`: change-password flow, me, customer, seller, admin (after bootstrap), store, category manage, product create/update (SELLER|ADMIN; create requires `variants[]`), address.  
Public: `forget-password`, `reset-password/verify-code`, `reset-password`, first `POST /admin/create-admin` (bootstrap only), `GET /category/get-categories`, `GET /product/get-product/:id`, `GET /product/get-products`, `GET /product/by-store/:store_name`, `GET /product/by-category/:category_id` (reads include `variants`).

API endpoints are tested with **Postman**. Full request/response shapes: [api.md](api.md).

### Optional: product variants smoke script

After Postgres is up and `npm run db` has been applied, from `Backend/`:

```bash
node scripts/smoke-variants.js
```

Starts the app **in-process** (no separate `npm run dev` needed). Checks: create without variants → 400; create with variants → 201; public get includes `variants`; update replace; empty `variants` → 400. Writes throwaway seller/store/product rows.

---

## Project structure (so far)

```text
YourSpeace/
├── README.md
├── docs/
│   ├── progress/         # Living sprint / done log
│   │   └── Progress.md
│   ├── process/          # Agile / Scrum process
│   │   └── Agile.md
│   ├── design/           # Domain model + ERD
│   │   ├── Domain_Model.md
│   │   └── ERD.md / ERD.mmd / ERD.png / ERD.pdf
│   └── setup/            # How to run the project
│       ├── Setup.md      # This file
│       ├── db.md         # PostgreSQL setup & tables
│       └── api.md        # HTTP API reference
└── Backend/
    ├── package.json
    ├── .env / .env.example
    ├── Database/
    │   ├── connection.js
    │   ├── schema.sql
    │   ├── apply_schema.js
    │   ├── set_password.sql
    │   └── migrate_*.sql      # one-off migrations (admins, categories, variants, …)
    ├── scripts/
    │   └── smoke-variants.js  # optional in-process product variants check
    └── src/
        ├── app.js
        ├── server.js
        ├── routes/            # health, auth, address, customer, seller, admin, store, category, product
        ├── controllers/
        ├── services/
        ├── rep/               # Repository (SQL)
        ├── middleware/        # sessionAuth, authorize / authorizeAny
        └── utils/             # mailer + emailTemplates (HTML)
```

### Backend request flow

```text
Route → Middleware (optional) → Controller → Service → Repository (rep) → PostgreSQL
```

Examples:
- `/api/health` → `health.controller` → `health.service`
- `/api/auth/*` → `auth.controller` → `auth.service` → `auth.repository` (+ `mailer` / `emailTemplates` on password emails; `sessionAuth` on change-password + `/verify-code`; reset verify is public)
- `/api/customer/*` → `sessionAuth` → `customer.controller` → `customer.service` → `customer.repository`
- `/api/seller/*` → `sessionAuth` + `authorize('SELLER')` → `seller.controller` → `seller.service` → `auth.repository` (user + sellers JOIN)
- `/api/admin/*` → create-admin: bootstrap or ADMIN; me: `sessionAuth` + `authorize('ADMIN')` (sets `req.user.admin_id`) → `admin.controller` → …
- `/api/store/*` → `sessionAuth` + `authorize('SELLER')` (sets `req.user.seller_id`) → `store.controller` → `store.service` → `store.repository`
- `/api/category/*` → manage: `sessionAuth` + `authorize('ADMIN')`; list: public → `category.controller` → …
- `/api/product/*` → create/update: SELLER|ADMIN (txn category + required variants); public reads include `variants` → `product.controller` → …
- `/api/address/*` → `sessionAuth` + `authorize('CUSTOMER')` → `address.controller` → `address.service` → `address.repository`
