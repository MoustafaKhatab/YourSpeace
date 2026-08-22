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
npm run db             # apply schema (users, addresses, sessions, password_reset_codes, sellers)
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
POST   http://localhost:3000/api/auth/reset-password
POST   http://localhost:3000/api/auth/change-password/request
POST   http://localhost:3000/api/auth/verify-code
PUT    http://localhost:3000/api/auth/change-password
GET    http://localhost:3000/api/customer/me
PUT    http://localhost:3000/api/customer/me
GET    http://localhost:3000/api/seller/me
POST   http://localhost:3000/api/address/create
GET    http://localhost:3000/api/address/get
PUT    http://localhost:3000/api/address/update/:address_id
DELETE http://localhost:3000/api/address/delete/:address_id
```

Protected with `x-session-id`: change-password flow, verify-code, me, customer, address.

API endpoints are tested with **Postman**. Full request/response shapes: [api.md](api.md).

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
    │   └── migrate_role_enum.sql
    └── src/
        ├── app.js
        ├── server.js
        ├── routes/            # health, auth, address, customer, seller
        ├── controllers/
        ├── services/
        ├── rep/               # Repository (SQL)
        ├── middleware/        # sessionAuth, authorize
        └── utils/             # mailer + emailTemplates (HTML)
```

### Backend request flow

```text
Route → Middleware (optional) → Controller → Service → Repository (rep) → PostgreSQL
```

Examples:
- `/api/health` → `health.controller` → `health.service`
- `/api/auth/*` → `auth.controller` → `auth.service` → `auth.repository` (+ `mailer` / `emailTemplates` on password emails; `sessionAuth` on change-password / verify-code / me)
- `/api/customer/*` → `sessionAuth` → `customer.controller` → `customer.service` → `customer.repository`
- `/api/seller/*` → `sessionAuth` + `authorize('SELLER')` → `seller.controller` → `seller.service` → `auth.repository` (user + sellers JOIN)
- `/api/address/*` → `sessionAuth` + `authorize('CUSTOMER')` → `address.controller` → `address.service` → `address.repository`
