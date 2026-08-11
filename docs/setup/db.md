# Database Setup

Guide for PostgreSQL on this project.

---

## Overview

| Item | Value |
|------|--------|
| Database name | `yourspeace` |
| Default user | `postgres` |
| Host | `localhost` |
| Port | `5432` |
| Schema file | `Backend/Database/schema.sql` |
| Connection pool | `Backend/Database/connection.js` |
| Env file | `Backend/.env` (gitignored) |

---

## Prerequisites

- PostgreSQL installed and running
- Node.js dependencies installed (`cd Backend && npm install`)
- `Backend/.env` filled in (copy from `.env.example` if needed)

---

## Environment variables

Create / edit `Backend/.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=yourspeace
DB_USER=postgres
DB_PASSWORD=postgres
```

`connection.js` reads these values into a `pg` Pool.

---

## One-time Postgres setup

### 1. Open psql as the postgres OS user

```bash
sudo -u postgres psql
```

`psql -U postgres` alone often fails on Ubuntu/WSL with **Peer authentication failed** — use `sudo -u postgres` for local socket access.

### 2. Set a password (must match `.env`)

From the project root:

```bash
sudo -u postgres psql -f Backend/Database/set_password.sql
```

Or:

```bash
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'postgres';"
```

### 3. Create the database (once)

```bash
sudo -u postgres createdb yourspeace
```

If you see `already exists`, that is fine.

### 4. Verify TCP login (what Node uses)

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d yourspeace -c "SELECT 1;"
```

---

## Apply the schema

From `Backend/`:

```bash
cd Backend
npm run db
```

This runs `Database/apply_schema.js`, which executes `Database/schema.sql` through the Node pool.

### Manual alternative

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d yourspeace -f Backend/Database/schema.sql
```

**Note:** Tables use `CREATE TABLE IF NOT EXISTS`, so re-running `npm run db` is safe for existing tables. It will not alter columns on tables that already exist — use a new migration/SQL change for that.

### List tables

```bash
sudo -u postgres psql -d yourspeace -c "\dt"
```

---

## How the app connects

1. `server.js` loads `.env` with `dotenv`
2. Imports the pool from `Database/connection.js`
3. Runs `SELECT 1` on startup — server starts only if the DB is reachable

```text
server.js  →  pool.query('SELECT 1')  →  PostgreSQL
```

### Using the database in code

Prefer **services** for SQL:

```js
const pool = require('../../Database/connection');

const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// result.rows      → data
// result.rowCount  → rows affected
```

Always use parameterized queries (`$1`, `$2`, …) — do not concatenate user input into SQL.

---

## npm scripts (Backend)

| Command | What it does |
|---------|----------------|
| `npm run db` | Apply `Database/schema.sql` |
| `npm run dev` | Start API with Nodemon (checks DB on boot) |
| `npm start` | Start API with Node |

---

## Files

```text
Backend/
├── .env                    # Local secrets (not committed)
├── .env.example            # Template for teammates
└── Database/
    ├── connection.js       # pg Pool export
    ├── schema.sql          # CREATE TABLE statements
    ├── apply_schema.js     # Used by npm run db
    └── set_password.sql    # Helper to set postgres password
```

Schema design reference: [ERD](../design/ERD.md)
