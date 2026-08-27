# Entity Relationship Diagram (ERD)

> This document describes the **database schema** for the Marketplace system.
> It translates the [Domain Model](Domain_Model.md) into concrete tables, keys, and relationships.
> The Mermaid source lives in [`ERD.mmd`](ERD.mmd).

---

## Overview

The schema supports a **multi-vendor marketplace**:

- Customers browse products, manage carts, and place orders.
- Sellers own stores and fulfill per-store orders.
- Admins manage the platform (same `USER` table, `role = ADMIN`).

Checkout is modeled as one **Order Package** (customer checkout) that may split into multiple **Orders** (one per store), each with its own **Shipment**. Payment goes through a **Payment Session** that may produce a successful **Payment**.

---

## Diagram

```mermaid
erDiagram
    USER ||--o{ ADDRESS : has
    USER ||--o| SELLER : "may be"
    SELLER ||--|| STORE : owns
    STORE ||--o{ PRODUCT : sells
    PRODUCT ||--o{ PRODUCT_IMAGE : has
    PRODUCT ||--o{ PRODUCT_VARIANT : has
    CATEGORY ||--o{ CATEGORY : "parent of"
    PRODUCT ||--o{ PRODUCT_CATEGORY : "classified as"
    CATEGORY ||--o{ PRODUCT_CATEGORY : contains
    USER ||--o{ CART : has
    CART ||--o{ CART_ITEM : contains
    PRODUCT_VARIANT ||--o{ CART_ITEM : "added as"
    USER ||--o{ ORDER_PACKAGE : places
    ORDER_PACKAGE ||--o{ ORDER : splits_into
    STORE ||--o{ ORDER : fulfills
    ORDER ||--o{ ORDER_ITEM : contains
    PRODUCT_VARIANT ||--o{ ORDER_ITEM : "ordered as"
    ORDER_PACKAGE ||--o{ PAYMENT_SESSION : "paid via"
    PAYMENT_SESSION ||--o| PAYMENT : "may produce"
    ORDER ||--|| SHIPMENT : ships
    USER ||--o{ REVIEW : writes
    PRODUCT ||--o{ REVIEW : receives

    USER {
        uuid user_id PK
        string email
        string hashed_password
        string first_name
        string last_name
        string phone_number
        enum role "CUSTOMER | SELLER | ADMIN"
    }

    ADDRESS {
        uuid id PK
        uuid user_id FK
        string add1
        string add2
        string city
        string state
        string country
        string postal_code
    }

    SELLER {
        uuid id PK
        uuid user_id FK
        datetime created_at
        datetime updated_at
    }

    STORE {
        uuid id PK
        uuid seller_id FK
        string name
        string description
        string logo_url
        datetime created_at
        datetime updated_at
    }

    PRODUCT {
        uuid id PK
        uuid store_id FK
        string title
        string description
        boolean hidden
        datetime created_at
        datetime updated_at
    }

    PRODUCT_IMAGE {
        uuid id PK
        uuid product_id FK
        string image_url
    }

    PRODUCT_VARIANT {
        uuid id PK
        uuid product_id FK
        string color
        string size
        int stock
    }

    CATEGORY {
        uuid id PK
        uuid parent_id FK
        string name
        boolean visible
        json metadata
    }

    PRODUCT_CATEGORY {
        uuid product_id FK
        uuid category_id FK
    }

    CART {
        uuid id PK
        uuid user_id FK
        string currency
        string status
        datetime created_at
        datetime updated_at
    }

    CART_ITEM {
        uuid id PK
        uuid cart_id FK
        uuid variant_id FK
        int quantity
        decimal unit_price
    }

    ORDER_PACKAGE {
        uuid id PK
        uuid user_id FK
        string status
        string currency
        decimal item_total
        decimal shipping_total
        decimal discount_total
        decimal grand_total
        datetime created_at
        datetime updated_at
    }

    ORDER {
        uuid id PK
        uuid order_package_id FK
        uuid store_id FK
        string status
        decimal item_total
        decimal shipping_cost
        decimal discount_total
        decimal grand_total
        datetime created_at
        datetime updated_at
    }

    ORDER_ITEM {
        uuid id PK
        uuid order_id FK
        uuid variant_id FK
        int quantity
        decimal unit_price
        decimal discount
        decimal subtotal
    }

    PAYMENT_SESSION {
        uuid id PK
        uuid order_package_id FK
        string provider
        string provider_session_id
        string status
        decimal amount
        string currency
        datetime expires_at
        datetime created_at
        datetime updated_at
    }

    PAYMENT {
        uuid id PK
        uuid payment_session_id FK
        string provider
        string transaction_id
        string status
        decimal amount
        string currency
        datetime paid_at
        datetime created_at
        datetime updated_at
    }

    SHIPMENT {
        uuid id PK
        uuid order_id FK
        string status
        string carrier
        string tracking_number
        datetime shipped_at
        datetime delivered_at
        datetime created_at
        datetime updated_at
    }

    REVIEW {
        uuid id PK
        uuid user_id FK
        uuid product_id FK
        int rating
        string comment_text
        datetime created_at
        datetime updated_at
    }
```

---

## Entities

### Identity & storefront

| Table | Purpose |
|-------|---------|
| **USER** | Single auth entity; role is `CUSTOMER`, `SELLER`, or `ADMIN` |
| **ADDRESS** | Shipping / billing addresses owned by a user |
| **SELLER** | Optional seller profile linked to a user (`USER` may be a seller) |
| **STORE** | Storefront owned by exactly one seller |

### Catalog

| Table | Purpose |
|-------|---------|
| **PRODUCT** | Product listing belonging to one store |
| **PRODUCT_IMAGE** | Images for a product |
| **PRODUCT_VARIANT** | Sellable SKU unit (color, size, stock) |
| **CATEGORY** | Shared hierarchical tree (`parent_id`); unique name per parent; **ADMIN** manages; public list is visible-only |
| **PRODUCT_CATEGORY** | Many-to-many link between products and categories |

### Cart & checkout

| Table | Purpose |
|-------|---------|
| **CART** | User shopping cart (currency + status) |
| **CART_ITEM** | Line item tied to a **variant** |
| **ORDER_PACKAGE** | Customer checkout aggregate (totals across sellers) |
| **ORDER** | Per-store slice of an order package |
| **ORDER_ITEM** | Line item on an order (variant + priced snapshot) |

### Payment & fulfillment

| Table | Purpose |
|-------|---------|
| **PAYMENT_SESSION** | Provider checkout session for an order package |
| **PAYMENT** | Successful (or recorded) payment produced by a session |
| **SHIPMENT** | One shipment per order (independent per seller) |

### Engagement

| Table | Purpose |
|-------|---------|
| **REVIEW** | Customer product review (rating + comment) |

---

## Key relationships

| From | To | Cardinality | Notes |
|------|-----|-------------|--------|
| USER | ADDRESS | 1:N | User has many addresses |
| USER | SELLER | 1:0..1 | User may be a seller |
| SELLER | STORE | 1:1 | Seller owns one store |
| STORE | PRODUCT | 1:N | Store sells many products |
| PRODUCT | PRODUCT_IMAGE | 1:N | |
| PRODUCT | PRODUCT_VARIANT | 1:N | Stock lives on the variant |
| CATEGORY | CATEGORY | 1:N | Parent / child hierarchy |
| PRODUCT ↔ CATEGORY | PRODUCT_CATEGORY | M:N | |
| USER | CART | 1:N | |
| CART | CART_ITEM | 1:N | Items reference variants |
| USER | ORDER_PACKAGE | 1:N | Checkout aggregate |
| ORDER_PACKAGE | ORDER | 1:N | One order per store in the package |
| STORE | ORDER | 1:N | Store fulfills its orders |
| ORDER | ORDER_ITEM | 1:N | |
| ORDER_PACKAGE | PAYMENT_SESSION | 1:N | Paid via session(s) |
| PAYMENT_SESSION | PAYMENT | 1:0..1 | Session may produce a payment |
| ORDER | SHIPMENT | 1:1 | One shipment per order |
| USER / PRODUCT | REVIEW | 1:N | User writes; product receives |

---

## Design notes

- **Seller is a separate table** — not every user is a seller; `SELLER` links `USER` → `STORE`.
- **Variants are the sellable unit** — cart and order items reference `PRODUCT_VARIANT`, not the parent product.
- **Order Package vs Order** — one customer payment checkout can span multiple sellers; each seller gets their own `ORDER` and `SHIPMENT`.
- **Payment Session vs Payment** — the session is the provider handshake; payment is the resulting transaction record.
- **Categories are hierarchical** via `CATEGORY.parent_id`.

---

## Source file

Edit the diagram in [`ERD.mmd`](ERD.mmd). Keep this document in sync when the schema changes.
