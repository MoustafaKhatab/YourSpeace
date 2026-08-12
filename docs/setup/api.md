# API Reference (so far)

Base URL: `http://localhost:3000`

All JSON endpoints use header: `Content-Type: application/json`

Test with **Postman**.

---

## Health

### `GET /api/health`

Checks that the API is up.

**Response `200`**
```json
{
  "status": "ok",
  "uptime": 12.34,
  "timestamp": "2026-08-12T20:00:00.000Z"
}
```

---

## Auth (sessionful)

Flow uses DB sessions (`sessions` table) and password reset codes (`password_reset_codes`).

```text
Register / Login  →  returns user + session
Forget password   →  needs session_id → returns email + code_verifier (dev stand-in for email)
Reset password    →  email + code_verifier + new_password
                    (transaction: update password, delete sessions, mark code used)
```

### `POST /api/auth/register`

Creates a user (role `CUSTOMER`), hashes password with bcrypt, creates a session.

**Body**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "first_name": "Moustafa",
  "last_name": "Khatab",
  "phone_number": "01000000000"
}
```

`phone_number` is optional.

**Response `201`**
```json
{
  "message": "User created successfully",
  "user": {
    "user_id": "1",
    "email": "user@example.com",
    "first_name": "Moustafa",
    "last_name": "Khatab",
    "phone_number": "01000000000",
    "role": "CUSTOMER"
  },
  "session": {
    "id": "1",
    "user_id": "1",
    "session_id": "uuid-here",
    "expires_at": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / invalid email |
| `409` | Email already registered |

---

### `POST /api/auth/login`

**Body**
```json
{
  "email": "user@example.com",
  "password": "secret123"
}
```

**Response `200`** — same shape as register (`user` + `session`). Password hash is never returned.

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / invalid email |
| `401` | Invalid email or password |

---

### `POST /api/auth/forget-password`

Dev flow (until email/Gmail is integrated): client must be logged in and send `session_id`. Server looks up the user via **JOIN** (`sessions` + `users`), creates a `code_verifier`, stores it in `password_reset_codes`, and returns the code in the response (later this will be emailed instead).

**Body**
```json
{
  "session_id": "uuid-from-login-or-register"
}
```

**Response `200`**
```json
{
  "message": "Reset code created (dev only — later sent by email)",
  "email": "user@example.com",
  "code_verifier": "uuid-code",
  "expires_at": "..."
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing `session_id` |
| `404` | Session not found or expired |

---

### `POST /api/auth/reset-password`

Verifies `email` + `code_verifier`, then in a **DB transaction**:
1. Update password  
2. Delete all sessions for that user  
3. Mark the reset code as `used = true`

**Body**
```json
{
  "email": "user@example.com",
  "code_verifier": "uuid-code",
  "new_password": "newSecret123"
}
```

**Response `200`**
```json
{
  "message": "Password reset successfully",
  "user": {
    "user_id": "1",
    "email": "user@example.com",
    "first_name": "Moustafa",
    "last_name": "Khatab",
    "phone_number": "01000000000",
    "role": "CUSTOMER"
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / invalid or used / expired code |
| `404` | User not found |

After a successful reset, the old `session_id` no longer works (sessions were deleted). User must **login** again.

---

## Not implemented yet

- `POST /api/auth/logout`
- `GET /api/auth/me`
- Sending reset codes by email (Gmail)

---

## Layering

```text
routes → controllers → services → rep (repository) → PostgreSQL
```

| Layer | Auth files |
|-------|------------|
| Routes | `src/routes/auth.routes.js` |
| Controllers | `src/controllers/auth.controller.js` |
| Services | `src/services/auth.service.js` |
| Repository | `src/rep/auth.repository.js` |
