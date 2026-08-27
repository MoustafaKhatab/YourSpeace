# YourSpeace

# Marketplace Backend

An enterprise-level multi-vendor marketplace built to demonstrate modern backend engineering practices.

The goal of this project is not only to build a production-ready backend, but also to document the complete software engineering process from business analysis to deployment.

---

## Follow the work

| Place | Role |
|-------|------|
| **[Jira Board](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)** | Upcoming sprints, backlog, user stories, and board status |
| **[Progress](docs/progress/Progress.md)** | Living repo log, working agreement, sprint board |
| **`docs/` phase files** | Stable artifacts for completed design/setup phases |

This project follows an **Agile Scrum** workflow. Process details and the epic list are in [Agile.md](docs/process/Agile.md).

---

## Documentation

| Document | Status | Description |
|----------|--------|-------------|
| [Progress](docs/progress/Progress.md) | Living | Sprint focus, working agreement, completed work log |
| [Setup](docs/setup/Setup.md) | Current | How to install and run the backend |
| [Database Setup](docs/setup/db.md) | Current | PostgreSQL, tables, `.env`, `npm run db` |
| [API Reference](docs/setup/api.md) | Current | Auth, customer, seller, admin, store, category, product (Postman) |
| [Domain Model](docs/design/Domain_Model.md) | Done | Business entities and relationships |
| [Database Design / ERD](docs/design/ERD.md) | Done | Full marketplace ER diagram (design) |
| [Agile Process](docs/process/Agile.md) | Done | Scrum methodology and product backlog epics |
| Architecture | Coming Soon | |

---

## Tech Stack

**In use so far**

- Node.js
- Express.js
- Nodemon
- PostgreSQL (`pg`)
- bcrypt
- uuid
- Nodemailer + Gmail (forget-password / change-password codes)
- Postman (API testing)

**Planned**

- Prisma ORM
- Docker
- Redis
- RabbitMQ

---

## Project Status

Sprint 4: Admin + Seller catalog (store, categories-by-admin, product create/update with required variants + transactional category). Next: images, then cart.

See **[Progress.md](docs/progress/Progress.md)** for what has landed, and **[Jira](https://codx207.atlassian.net/jira/software/projects/SCRUM/summary?atlOrigin=eyJpIjoiZGRjNTQ2ZTJhOTk2NDkyOWJhNzJiMGNmYzRlMmUzNjQiLCJwIjoiaiJ9)** for what is coming next.
