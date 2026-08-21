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
Logout            →  x-session-id header → find user → delete that session
Me                →  x-session-id header (+ sessionAuth) → return current user
Forget password   →  email in body → create code_verifier → send by Gmail (not in JSON)
Reset password    →  email + code_verifier (from inbox) + new_password
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

Creates a `code_verifier`, stores it in `password_reset_codes`, and **emails** it to the user via Gmail (Nodemailer). The code is **not** returned in the JSON body.

Requires `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `Backend/.env` (see [Setup.md](Setup.md)).

**Body**
```json
{
  "email": "user@example.com"
}
```

**Response `200`**
```json
{
  "message": "code_verifier and expires_at sent to email successfully"
}
```

Then open the inbox for that email, copy the `code_verifier`, and call **reset-password**.

**Errors**
| Status | When |
|--------|------|
| `400` | Missing email |
| `404` | User not found |
| `500` | Mail send failed (check Gmail env / App Password) |

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

### `POST /api/auth/logout`

Takes `x-session-id` header, finds the user via JOIN (`sessions` + `users`), then deletes that session row.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | uuid from login/register |

No body required.

**Response `200`**
```json
{
  "message": "Logged out successfully"
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing `x-session-id` header |
| `404` | Session not found or already logged out |

---

### `GET /api/auth/me`

Returns the current user for a valid session. Route uses `sessionAuth` + `authorize('CUSTOMER')`.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | uuid from login/register |

```http
GET http://localhost:3000/api/auth/me
x-session-id: uuid-from-login-or-register
```

**Response `200`**
```json
{
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
| `401` | Missing/invalid/expired `x-session-id` |
| `403` | Role not allowed (requires `CUSTOMER`) |

---

## Address (CUSTOMER)

All address routes require:

| Header | Value |
|--------|--------|
| `x-session-id` | session from login/register |
| `Content-Type` | `application/json` (for create / update) |

Middleware: `sessionAuth` + `authorize('CUSTOMER')`.  
`user_id` always comes from the session (`req.user`), never from the client body.

### `POST /api/address/create`

**Body**
```json
{
  "address_line1": "123 Main St",
  "address_line2": "Apt 4",
  "city": "Cairo",
  "state": "Cairo",
  "country": "Egypt",
  "postal_code": "11511"
}
```

`address_line2` is optional.

**Response `201`**
```json
{
  "message": "Address created successfully",
  "address": {
    "address_id": "1",
    "user_id": "1",
    "address_line1": "123 Main St",
    "address_line2": "Apt 4",
    "city": "Cairo",
    "state": "Cairo",
    "country": "Egypt",
    "postal_code": "11511"
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing required fields |
| `401` | Missing/invalid session |
| `403` | Not a CUSTOMER |

---

### `GET /api/address/get`

Returns **all** addresses for the logged-in user.

**Response `200`**
```json
{
  "message": "Addresses fetched successfully",
  "addresses": [
    {
      "address_id": "1",
      "user_id": "1",
      "address_line1": "123 Main St",
      "address_line2": "Apt 4",
      "city": "Cairo",
      "state": "Cairo",
      "country": "Egypt",
      "postal_code": "11511"
    }
  ]
}
```

Empty list returns `addresses: []` (still `200`).

---

### `PUT /api/address/update/:address_id`

Updates an address only if it belongs to the logged-in user.

Example: `PUT http://localhost:3000/api/address/update/1`

**Body**
```json
{
  "address_line1": "456 New St",
  "address_line2": "Floor 2",
  "city": "Alexandria",
  "state": "Alexandria",
  "country": "Egypt",
  "postal_code": "21500"
}
```

`address_line2` is optional.

**Response `200`**
```json
{
  "message": "Address updated successfully",
  "address": {
    "address_id": "1",
    "user_id": "1",
    "address_line1": "456 New St",
    "address_line2": "Floor 2",
    "city": "Alexandria",
    "state": "Alexandria",
    "country": "Egypt",
    "postal_code": "21500"
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing required fields |
| `401` | Missing/invalid session |
| `403` | Not a CUSTOMER |
| `404` | Address not found or not owned by this user |

---

### `DELETE /api/address/delete/:address_id`

Deletes only if the address belongs to the logged-in user.

Example: `DELETE http://localhost:3000/api/address/delete/1`

**Response `200`**
```json
{
  "message": "Address deleted successfully",
  "address": { "address_id": "1" }
}
```

**Errors**
| Status | When |
|--------|------|
| `401` | Missing/invalid session |
| `403` | Not a CUSTOMER |
| `404` | Address not found or not owned by this user |

---

## Customer profile

Requires `x-session-id` (via `sessionAuth`). Updates **name and phone only** — email changes are deferred to a later Gmail/verification flow.

### `PUT /api/customer/me`

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login/register |
| `Content-Type` | `application/json` |

**Body**
```json
{
  "first_name": "Moustafa",
  "last_name": "Updated",
  "phone_number": "01012345678"
}
```

Do **not** send `email` in the body.

**Response `200`**
```json
{
  "message": "Customer updated successfully",
  "customer": {
    "user_id": "1",
    "first_name": "Moustafa",
    "last_name": "Updated",
    "email": "user@example.com",
    "phone_number": "01012345678"
  }
}
```

`email` is returned as read-only (not updated).

**Errors**
| Status | When |
|--------|------|
| `400` | Missing required fields, or `email` was included in the body |
| `401` | Missing/invalid session |

---

## Not implemented yet

- Changing account email (verification flow)
- Logged-in “change password” with old password (current flow is forget → email code → reset)

---

## Layering

```text
Route → Middleware (sessionAuth / authorize) → Controller → Service → Repository → PostgreSQL
```

Mail helper (used by forget-password): `src/utils/mailer.js` (`sendMail` via Nodemailer + Gmail).

| Feature | Routes | Controllers | Services | Repository |
|---------|--------|-------------|----------|------------|
| Auth | `auth.routes.js` | `auth.controller.js` | `auth.service.js` | `auth.repository.js` |
| Address | `address.routes.js` | `address.controller.js` | `address.service.js` | `address.repository.js` |
| Customer | `customer.routes.js` | `customer.controller.js` | `customer.service.js` | `customer.repository.js` |
| Health | `health.routes.js` | `health.controller.js` | `health.service.js` | — |
