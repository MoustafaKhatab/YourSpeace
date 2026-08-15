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
| API testing | Postman |
| Planned later | Prisma, Docker, Redis, RabbitMQ, Gmail for reset codes |

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
cp .env.example .env   # then edit DB_PASSWORD if needed
npm run db             # apply schema (users, addresses, sessions, password_reset_codes)
npm run dev
```

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start server with Nodemon (auto-reload) |
| `npm start` | Start server with Node |
| `npm run db` | Apply `Database/schema.sql` to PostgreSQL |

- Database guide: **[db.md](db.md)**
- API reference: **[api.md](api.md)**

Server default: `http://localhost:3000`

### Quick checks

```text
GET    http://localhost:3000/api/health
POST   http://localhost:3000/api/auth/register
POST   http://localhost:3000/api/auth/login
GET    http://localhost:3000/api/auth/me
POST   http://localhost:3000/api/address/create
GET    http://localhost:3000/api/address/get
DELETE http://localhost:3000/api/address/delete/:address_id
```

Protected routes need header: `x-session-id: <session_id from login/register>`.

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
        ├── routes/            # health, auth, address
        ├── controllers/
        ├── services/
        ├── rep/               # Repository (SQL)
        └── middleware/        # sessionAuth, authorize
```

### Backend request flow

```text
Route → Middleware (optional) → Controller → Service → Repository (rep) → PostgreSQL
```

Examples:
- `/api/health` → `health.controller` → `health.service`
- `/api/auth/*` → `auth.controller` → `auth.service` → `auth.repository`
- `/api/address/*` → `sessionAuth` + `authorize('CUSTOMER')` → `address.controller` → `address.service` → `address.repository`
