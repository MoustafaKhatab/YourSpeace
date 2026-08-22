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
Forget password   →  email in body → create code_verifier → HTML email (Gmail)
Verify code       →  REQUIRED before reset/change (sets verified=true; checks expiry here only)
Reset password    →  email + code_verifier + new_password (code must be verified)
Change password   →  (any logged-in role)
  1) POST /change-password/request → email code to session user
  2) POST /verify-code → marks code verified
  3) PUT  /change-password → requires verified code → update + invalidate sessions
```

### `POST /api/auth/register`

Creates a user, hashes password with bcrypt, creates a session.

- **`role` optional** — defaults to `CUSTOMER`. Allowed: `CUSTOMER` | `SELLER` only (`ADMIN` is rejected).
- **`SELLER`** — also inserts a row in `sellers` (transaction: user + seller profile).

**Body**
```json
{
  "email": "user@example.com",
  "password": "secret123",
  "first_name": "Moustafa",
  "last_name": "Khatab",
  "phone_number": "01000000000",
  "role": "CUSTOMER"
}
```

`phone_number` and `role` are optional.

**Response `201` (customer)**
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

**Response `201` (seller)** — same as above, plus:
```json
{
  "seller": {
    "seller_id": "1"
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / invalid email / invalid role |
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
  "message": "Reset code sent to email successfully"
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

**Requires a prior successful `POST /auth/verify-code`.**  
Applies the new password only if the code has `verified = true`. Expiry is **not** re-checked here (that happens only in verify-code).

Verifies `email` + `code_verifier` (+ verified flag), then in a **DB transaction**:
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
| `400` | Missing fields / invalid code / not verified / already used |
| `404` | User not found |

After a successful reset, the old `session_id` no longer works (sessions were deleted). User must **login** again.

---

### `POST /api/auth/verify-code`

**Required step** before `reset-password` or `change-password`.  
This is the **only** place that validates expiry / unused. On success it sets `verified = true` on the code (does not mark `used`).

**Logged-in (change-password):** send `x-session-id` — email comes from the session.  
**Not logged-in (forget-password):** send `email` in the body.

**Headers (optional session)**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login (optional) |
| `Content-Type` | `application/json` |

**Body (logged-in)**
```json
{
  "code_verifier": "uuid-from-email"
}
```

**Body (forget flow)**
```json
{
  "email": "user@example.com",
  "code_verifier": "uuid-from-email"
}
```

**Response `200`**
```json
{
  "message": "Code verified successfully",
  "verified": true,
  "expires_at": "..."
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / invalid / used / expired code |
| `401` | Invalid session (only if `x-session-id` was sent) |

---

### `POST /api/auth/change-password/request`

**Change-password step 1** (any logged-in role: CUSTOMER / SELLER / ADMIN). Creates a code and emails it to **`req.user.email` only** (not from body). Uses HTML template `changePassword` in `src/utils/emailTemplates.js`.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login |

No body required.

**Response `200`**
```json
{
  "message": "Change password code sent to your email successfully"
}
```

**Errors**
| Status | When |
|--------|------|
| `401` | Missing/invalid session |
| `500` | Mail send failed |

---

### `PUT /api/auth/change-password`

**Change-password step 3** (any logged-in role). **Requires prior `verify-code`.**  
Same DB transaction as reset-password. Email is always from the session — never from the body.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login |
| `Content-Type` | `application/json` |

**Body**
```json
{
  "code_verifier": "uuid-from-email",
  "new_password": "newSecret123",
  "confirm_password": "newSecret123"
}
```

`confirm_password` is optional; if sent, it must match `new_password`.  
`new_password` must be at least **8** characters.

**Response `200`**
```json
{
  "message": "Password changed successfully. Please log in again.",
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

After success, the current `session_id` is invalid — user must **login** again. A confirmation email (`passwordChanged` template) is sent when mail works.

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / mismatch / weak password / code not verified / already used |
| `401` | Missing/invalid session |

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

Requires `x-session-id` + `sessionAuth` + `authorize('CUSTOMER')`.  
Updates **name and phone only** — email changes are deferred to a later Gmail/verification flow.

### `GET /api/customer/me`

Returns the current customer for a valid session.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | uuid from login/register |

```http
GET http://localhost:3000/api/customer/me
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

## Seller profile

Requires `x-session-id` + `sessionAuth` + `authorize('SELLER')`.  
`user_id` comes from the session; SQL joins `users` + `sellers` where `role = 'SELLER'`.

### `GET /api/seller/me`

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login/register |

**Response `200`**
```json
{
  "message": "Seller profile fetched successfully",
  "user": {
    "user_id": "15",
    "email": "seller@example.com",
    "first_name": "Moustafa",
    "last_name": "Khatab",
    "phone_number": "01000000000",
    "role": "SELLER"
  },
  "seller": {
    "seller_id": "1",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `401` | Missing/invalid session |
| `403` | Not a SELLER |
| `404` | No seller row for this user |

---

## Not implemented yet

- Changing account email (verification flow)

---

## Layering

```text
Route → Middleware (sessionAuth / authorize) → Controller → Service → Repository → PostgreSQL
```

Email: `src/utils/mailer.js` + templates in `src/utils/emailTemplates.js`  
(`changePassword`, `forgetPassword`, `passwordChanged`).

| Feature | Routes | Controllers | Services | Repository |
|---------|--------|-------------|----------|------------|
| Auth | `auth.routes.js` | `auth.controller.js` | `auth.service.js` | `auth.repository.js` |
| Address | `address.routes.js` | `address.controller.js` | `address.service.js` | `address.repository.js` |
| Customer | `customer.routes.js` | `customer.controller.js` | `customer.service.js` | `customer.repository.js` |
| Seller | `seller.routes.js` | `seller.controller.js` | `seller.service.js` | `auth.repository.js` (JOIN via `getUserById`) |
| Health | `health.routes.js` | `health.controller.js` | `health.service.js` | — |
