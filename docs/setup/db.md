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

Full marketplace ERD (design): [ERD.md](../design/ERD.md)  
What is **implemented in SQL so far** is listed below (auth foundation).

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

---

## Tables implemented so far

| Table | Purpose |
|-------|---------|
| `users` | Accounts (email, hashed_password, names, role, …) |
| `sessions` | Sessionful auth tokens (`session_id`, `expires_at`) |
| `password_reset_codes` | Dev/email reset codes (`code_verifier`, `used`, `expires_at`) |

### `users`
- `user_id` PK  
- `email` unique  
- `hashed_password`  
- `first_name`, `last_name`, `phone_number`  
- `role` (e.g. `CUSTOMER`)

### `sessions`
- `id` PK  
- `user_id` FK → `users` (ON DELETE CASCADE)  
- `session_id` unique  
- `expires_at`, `created_at`, `updated_at`

### `password_reset_codes`
- `id` PK  
- `email`  
- `code_verifier` unique  
- `used` (boolean)  
- `expires_at`, `created_at`

Password reset uses a **transaction**: update password + delete user sessions + mark code `used`.

---

## Inspect tables (psql)

Connect:

```bash
sudo -u postgres psql -d yourspeace
```

Useful commands:

```sql
\dt                          -- list tables
\d users                     -- describe one table
\d sessions
\d password_reset_codes

SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM password_reset_codes;
SELECT * FROM users LIMIT 10;
SELECT COUNT(*) FROM sessions;
```

One-shot from the shell:

```bash
sudo -u postgres psql -d yourspeace -c "\dt"
sudo -u postgres psql -d yourspeace -c "\d users"
sudo -u postgres psql -d yourspeace -c "SELECT * FROM password_reset_codes;"
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

SQL lives mainly in **`src/rep/`** (repository). Services call the repository; prefer parameterized queries:

```js
const result = await pool.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// result.rows      → data
// result.rowCount  → rows affected
```

For multi-step writes that must succeed together (e.g. reset password), use a client transaction: `BEGIN` → queries → `COMMIT` / `ROLLBACK`.

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

API usage: [api.md](api.md)
