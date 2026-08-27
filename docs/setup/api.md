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
Verify reset code →  POST /reset-password/verify-code (email + code from body; no session)
Reset password    →  email + code_verifier + new_password (code must be verified)
Change password   →  (any logged-in role)
  1) POST /change-password/request → email code to session user
  2) POST /verify-code → marks code verified (session only)
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

Then open the inbox for that email, copy the `code_verifier`, call **`POST /reset-password/verify-code`**, then **reset-password**.

**Errors**
| Status | When |
|--------|------|
| `400` | Missing email |
| `404` | User not found |
| `500` | Mail send failed (check Gmail env / App Password) |

---

### `POST /api/auth/reset-password/verify-code`

**Forget/reset step 2** — public (no session). Email comes from the body only (the address that received the Gmail code). Ignores any `x-session-id`.

This is the **only** place that validates expiry / unused for the forget flow. On success it sets `verified = true` (does not mark `used`).

**Body**
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

---

### `POST /api/auth/reset-password`

**Requires a prior successful `POST /auth/reset-password/verify-code`.**  
Applies the new password only if the code has `verified = true`. Expiry is **not** re-checked here (that happens only in verify).

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

**Change-password step 2** — requires `x-session-id`. Email always from the session (never from body).

This is the **only** place that validates expiry / unused for the change-password flow. On success it sets `verified = true` (does not mark `used`).

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login |
| `Content-Type` | `application/json` |

**Body**
```json
{
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
| `401` | Missing / invalid session |

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
`user_id` comes from the session; `authorize('SELLER')` also sets `req.user.seller_id` via JOIN `users` + `sellers`.

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

## Store

Requires `x-session-id` + `sessionAuth` + `authorize('SELLER')`.  
`seller_id` is **not** taken from the client. `authorize('SELLER')` loads it server-side (JOIN `users` + `sellers`) and sets `req.user.seller_id`. One store per seller (`stores.seller_id` UNIQUE).

### `POST /api/store/create-store`

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login/register (SELLER) |
| `Content-Type` | `application/json` |

**Body**
```json
{
  "name": "My Shop",
  "description": "Optional store description"
}
```

- `name` — required, trimmed, max **255** characters  
- `description` — optional, trimmed, max **5000** characters  

**Response `201`**
```json
{
  "message": "Store created successfully",
  "store": {
    "store_id": "1",
    "seller_id": "1",
    "name": "My Shop",
    "description": "Optional store description",
    "logo_url": null,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing/invalid `name` or too-long fields |
| `401` | Missing/invalid session |
| `403` | Not a SELLER |
| `404` | No seller profile for this user |
| `409` | Seller already has a store, or store name taken |

---

### `GET /api/store/get-user-store`

Returns the authenticated seller’s store (looked up by `req.user.seller_id`).

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login/register (SELLER) |

**Response `200`**
```json
{
  "message": "User store retrieved successfully",
  "store": {
    "store_id": "1",
    "seller_id": "1",
    "name": "My Shop",
    "description": "Optional store description",
    "logo_url": null,
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
| `404` | No seller profile, or seller has no store yet |

---

### `PUT /api/store/update-user-store`

Partial update of the authenticated seller’s store. Only fields present in the body are changed (`COALESCE` in SQL). Sets `updated_at`.

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from login/register (SELLER) |
| `Content-Type` | `application/json` |

**Body** (at least one field required)
```json
{
  "name": "Updated Shop",
  "description": "New description",
  "logo_url": "https://cdn.example.com/logo.png"
}
```

- `name` — optional; if sent: trimmed, non-empty, max **255**; must not collide with another seller’s store  
- `description` — optional; if sent: trimmed, non-empty, max **5000**  
- `logo_url` — optional; if sent: trimmed, non-empty, max **500**, must start with `http://` or `https://`  

**Response `200`**
```json
{
  "message": "User store updated successfully",
  "store": {
    "store_id": "1",
    "seller_id": "1",
    "name": "Updated Shop",
    "description": "New description",
    "logo_url": "https://cdn.example.com/logo.png",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | No fields / empty / too long / invalid `logo_url` |
| `401` | Missing/invalid session |
| `403` | Not a SELLER |
| `404` | No seller profile or no store |
| `409` | Store name taken by another seller |

---

---

## Admin

`ADMIN` cannot self-register via `/auth/register`. Use `/api/admin/create-admin`.

- **First admin (bootstrap):** no session required when `admins` is empty.  
- **Later admins:** `x-session-id` + `authorize('ADMIN')` (sets `req.user.admin_id`).  
Creates `users` row (`role = ADMIN`) + `admins` row in one transaction; returns a session (same idea as register).

### `POST /api/admin/create-admin`

**Headers** (required after the first admin exists)
| Key | Value |
|-----|--------|
| `x-session-id` | session of an existing ADMIN |
| `Content-Type` | `application/json` |

**Body**
```json
{
  "email": "admin@example.com",
  "password": "secret123",
  "first_name": "Ada",
  "last_name": "Admin",
  "phone_number": "01000000000"
}
```

- `email`, `password`, `first_name`, `last_name` — required  
- `password` — min **8** characters  
- `phone_number` — optional  

**Response `201`**
```json
{
  "message": "First admin created successfully",
  "user": { "user_id": "1", "email": "admin@example.com", "role": "ADMIN", "...": "..." },
  "admin": { "admin_id": "1", "user_id": "1", "created_at": "...", "updated_at": "..." },
  "session": { "session_id": "uuid-here", "expires_at": "..." }
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields / short password |
| `401` | Not bootstrap and missing/invalid session |
| `403` | Not bootstrap and not ADMIN |
| `409` | Email already registered |

---

### `GET /api/admin/me`

Requires `sessionAuth` + `authorize('ADMIN')`.

**Response `200`**
```json
{
  "message": "Admin profile fetched successfully",
  "user": { "user_id": "1", "email": "...", "role": "ADMIN", "...": "..." },
  "admin": { "admin_id": "1", "created_at": "...", "updated_at": "..." }
}
```

---

### `PUT /api/admin/me`

Requires `sessionAuth` + `authorize('ADMIN')`. Updates name/phone (not email).

**Body**
```json
{
  "first_name": "Ada",
  "last_name": "Admin",
  "phone_number": "01000000000"
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing fields, or email in body |
| `401` / `403` | Auth |
| `404` | Admin profile not found |

---

## Category (global tree)

**Management** (create / get-by-id / update / delete): `sessionAuth` + `authorize('ADMIN')`.  
**Public list:** `GET /get-categories` (visible only).  
Categories are shared (not store-owned). Unique name per parent (case-insensitive).

### `POST /api/category/create-category`

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | session from admin create/login (ADMIN) |
| `Content-Type` | `application/json` |

**Body (root category)**
```json
{
  "name": "Electronics",
  "visible": true,
  "metadata": { "icon": "devices" }
}
```

**Body (subcategory)** — `parent_id` must exist
```json
{
  "name": "Phones",
  "parent_id": 1,
  "visible": true
}
```

- `name` — required, trimmed, max **255**; unique under the same parent  
- `visible` — optional boolean (default `true`)  
- `metadata` — optional object  
- `parent_id` — optional; omit/`null` = root  

**Response `201`** — `{ message, category }`

**Errors**
| Status | When |
|--------|------|
| `400` | Invalid name / visible / metadata / parent_id |
| `401` | Missing/invalid session |
| `403` | Not an ADMIN |
| `404` | Parent category not found |
| `409` | Name already exists under that parent (or at root) |

---

### `GET /api/category/get-category/:category_id`

**ADMIN.** Returns one category (visible or not).

**Errors:** `400` invalid id · `401`/`403` auth · `404` not found

---

### `PUT /api/category/update-category/:category_id`

**ADMIN.** Partial update: any of `name`, `visible`, `metadata`, `parent_id` (null = root).

**Errors:** same family as create (`400`/`401`/`403`/`404`/`409`)

---

### `DELETE /api/category/delete-category/:category_id`

**ADMIN.** Deletes the category. Children get `parent_id = NULL` (schema ON DELETE SET NULL). Product links cascade-delete from `product_categories`.

**Errors:** `400` · `401`/`403` · `404`

---

### `GET /api/category/get-categories`

**Public** (no session). Returns a flat list of **visible** categories (`visible = true`), ordered by parent then name.

**Response `200`**
```json
{
  "message": "Categories retrieved successfully",
  "categories": [
    {
      "category_id": "1",
      "parent_id": null,
      "name": "Electronics",
      "visible": true,
      "metadata": null,
      "created_at": "...",
      "updated_at": "..."
    },
    {
      "category_id": "2",
      "parent_id": "1",
      "name": "Phones",
      "visible": true,
      "metadata": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```


---

## Product

**Write** (`create` / `update`): `sessionAuth` + `authorizeAny('SELLER', 'ADMIN')`.  
**Read** (feed / by-store / by-category / by-id): **public** — no session.  
Sellers do **not** manage categories; they send a `category_id` from the client (from `GET /category/get-categories`).  
Create/update with a category uses a **DB transaction** (`products` + `product_categories`). One category per product.

### `POST /api/product/create-product`

- **SELLER** — product goes to the seller’s store (`seller_id` → store). Do **not** send `store_id`.  
- **ADMIN** — must send `store_id` of the target store.  
Optional `category_id`: must exist or **404**; nothing is partially committed (transaction).

**Headers**
| Key | Value |
|-----|--------|
| `x-session-id` | SELLER or ADMIN session |
| `Content-Type` | `application/json` |

**Body (seller)**
```json
{
  "title": "Phone Case",
  "description": "Clear case",
  "hidden": false,
  "category_id": 1
}
```

**Body (admin)** — same fields plus required `store_id`.

- `title` — required, trimmed, max **255**  
- `description` — optional  
- `hidden` — optional boolean (default `false`)  
- `category_id` — optional; client-chosen id from category list  
- `store_id` — required for ADMIN only  

**Response `201`** — includes `product_id` (use this for later get/update), `categories[]`, and when assigned `category_id` / `category_name`.

**Errors**
| Status | When |
|--------|------|
| `400` | Invalid fields; ADMIN missing `store_id` |
| `401` | Missing/invalid session |
| `403` | Not SELLER or ADMIN |
| `404` | No seller store, store not found, or category not found |

---

### `PUT /api/product/update-product/:product_id`

**SELLER** — only products in their store. **ADMIN** — any product.  
Partial body. `category_id`: omit = unchanged; `null` = clear; number = set/replace (transactional).

**Example body**
```json
{
  "title": "Phone Case XL",
  "hidden": false,
  "category_id": 2
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Invalid fields / empty body |
| `401` / `403` | Auth or not owner (seller) |
| `404` | Product or category not found |

---

### `GET /api/product/get-product/:product_id`

**Public.** One visible product by id (hidden → **404**). Returns `product_id` and `categories: [{ category_id, name }]`.

---

### `GET /api/product/get-products`

**Public.** Main-page feed: newest visible (`hidden = false`) products across all stores. Includes `store_name` and `categories: [{ category_id, name }, ...]`.

**Query (optional)**
| Param | Default | Notes |
|-------|---------|--------|
| `limit` | `20` | positive integer, max **100** |
| `offset` | `0` | non-negative integer |

**Example:** `GET /api/product/get-products?limit=20&offset=0`

**Response `200`**
```json
{
  "message": "Products retrieved successfully",
  "products": [
    {
      "product_id": "1",
      "store_id": "2",
      "store_name": "My Shop",
      "title": "...",
      "hidden": false,
      "categories": [{ "category_id": "2", "name": "Phones" }]
    }
  ]
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Invalid `limit` or `offset` |

---

### `GET /api/product/by-store/:store_name`

**Public.** Visible products for a store by name (case-insensitive). Each item includes `product_id` and `categories`.

**Example:** `GET /api/product/by-store/My%20Shop`

**Response `200`**
```json
{
  "message": "Products retrieved successfully",
  "products": [
    {
      "product_id": "1",
      "store_id": "2",
      "title": "...",
      "hidden": false,
      "categories": [{ "category_id": "2", "name": "Phones" }]
    }
  ]
}
```

**Errors**
| Status | When |
|--------|------|
| `400` | Missing store_name |
| `404` | Store not found |

---

### `GET /api/product/by-category/:category_id`

**Public.** Visible products assigned to this category **or any visible descendant** (recursive tree via `WITH RECURSIVE`). Category must exist and be `visible`. Same `categories` array shape as by-store.

**Example:** `GET /api/product/by-category/1`

**Response `200`** — same shape as by-store (`products` array).

**Errors**
| Status | When |
|--------|------|
| `400` | Invalid category_id |
| `404` | Category not found / not visible |

---

## Not implemented yet

- Changing account email (verification flow)
- Product variants / images

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
| Seller | `seller.routes.js` | `seller.controller.js` | `seller.service.js` | `auth.repository.js` |
| Admin | `admin.routes.js` | `admin.controller.js` | `admin.service.js` | `admin.repository.js` + `auth.repository.js` |
| Store | `store.routes.js` | `store.controller.js` | `store.service.js` | `store.repository.js` (`req.user.seller_id` from `authorize`) |
| Category | `category.routes.js` | `category.controller.js` | `category.service.js` | `category.repository.js` (ADMIN manage; public list) |
| Product | `product.routes.js` | `product.controller.js` | `product.service.js` | `product.repository.js` (SELLER\|ADMIN write; public read; txn category) |
| Health | `health.routes.js` | `health.controller.js` | `health.service.js` | — |
