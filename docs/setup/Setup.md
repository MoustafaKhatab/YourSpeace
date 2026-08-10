# Setup

Brief guide for running the project so far.

---

## Tech Stack (so far)

| Layer | Technology |
|-------|------------|
| Runtime | Node.js |
| Framework | Express.js |
| Dev server | Nodemon |
| API testing | Postman |
| Planned later | PostgreSQL, Prisma, Docker, Redis, RabbitMQ |

---

## Prerequisites

- Node.js (LTS recommended)
- npm

---

## Backend setup

```bash
cd Backend
npm install
npm run dev
```

| Command | What it does |
|---------|----------------|
| `npm run dev` | Start server with Nodemon (auto-reload) |
| `npm start` | Start server with Node |

Server default: `http://localhost:3000`

### Health check

```text
GET http://localhost:3000/api/health
```

API endpoints are tested with **Postman**.

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
│       └── Setup.md      # This file
└── Backend/
    ├── package.json
    └── src/
        ├── app.js         # Express app setup
        ├── server.js      # Server entry point
        ├── controllers/   # Request handlers
        ├── routes/        # API routes
        ├── services/      # Business logic
        └── middleware/    # Express middleware (ready for use)
```

### Backend request flow

```text
Route → Controller → Service → Response
```

Example: `/api/health` → `health.controller` → `health.service`
