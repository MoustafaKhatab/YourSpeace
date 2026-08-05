# Domain Model

> This document describes the core business entities and their relationships within the Marketplace system.
> It is a business representation of the system and **not** a database schema.

---

# Overview

The Marketplace is a **multi-vendor e-commerce platform** where:

- Customers browse and purchase products.
- Sellers create stores and sell products.
- Administrators manage the platform.

---

# User

The system contains a single **User** entity.

Every user has **exactly one role**.

```
User
│
├── CUSTOMER
├── SELLER
└── ADMIN
```

## Decision

- One authentication system.
- One User entity.
- One role per user.
- A user cannot be both a Buyer and a Seller.

---

# Store

Each Seller owns exactly one Store.

```
Seller
    │
    ▼
 Store
```

A Store contains:

- Name
- Description
- Logo
- Banner
- Contact Information
- Products

---

# Product

Every product belongs to exactly one Store.

```
Store
    │
    ▼
 Product
```

A Product contains business information such as:

- Name
- Description
- Price
- Stock
- SKU
- Status

---

# Product Images

A Product can contain multiple images.

```
Product
    │
    ├── Image 1
    ├── Image 2
    ├── Image 3
    └── ...
```

---

# Product Variants

Products may contain variants.

Examples:

- Color
- Size
- Capacity
- Weight

```
Product
    │
    ├── Black
    ├── White
    ├── Blue
    └── ...
```

---

# Categories

Categories are hierarchical.

Example:

```
Clothing
│
├── Men
│   ├── Shirts
│   ├── Pants
│   └── Shoes
│
└── Women
    ├── Dresses
    └── Bags
```

Products belong to one or more categories.

---

# Tags

Tags are used for filtering and product discovery.

Examples:

- Summer
- Sale
- New Arrival
- Trending

Tags are different from Categories.

Categories define where a product belongs.

Tags describe the product.

---

# Stock Rules

Products remain visible even when stock reaches zero.

```
Stock = 0

↓

Product remains visible

↓

Customer sees "Out of Stock"
```

---

# Stock Alerts

Customers may subscribe to receive notifications when a product becomes available again.

```
Product

↓

Out Of Stock

↓

Customer clicks

Notify Me

↓

Stock Alert Created

↓

Seller updates stock

↓

Notification Sent
```

---

# Shopping Flow

```
Browse Product

↓

Add To Cart

↓

Checkout

↓

Payment

↓

Purchase Created

↓

Seller Orders Created

↓

Shipment

↓

Delivered

↓

Review
```

---

# Cart

Each Customer has one active Cart.

```
Customer

↓

Cart

↓

Cart Item

↓

Product
```

Cart Items contain:

- Product
- Quantity
- Selected Variant

---

# Purchase

A Purchase represents everything a customer buys during a single checkout.

```
Purchase

↓

Payment

↓

Seller Orders
```

Customers pay **once** per Purchase.

---

# Seller Orders

One Purchase may contain products from multiple Sellers.

The system automatically creates one Seller Order for each Seller.

```
Purchase
│
├── Seller Order A
│
├── Seller Order B
│
└── Seller Order C
```

Each Seller only manages their own order.

---

# Order Items

Each Seller Order contains one or more Order Items.

```
Seller Order

↓

Order Item

↓

Product
```

Order Items preserve historical data even if a Product changes later.

---

# Payment

A Purchase has one Payment.

Payment represents the financial transaction only.

```
Purchase

↓

Payment
```

Example statuses:

- Pending
- Processing
- Succeeded
- Failed
- Refunded

---

# Shipment

Each Seller Order has its own Shipment.

```
Seller Order

↓

Shipment
```

This allows different Sellers to ship independently.

Example statuses:

- Pending
- Preparing
- Shipped
- In Transit
- Delivered
- Returned

---

# Reviews

Customers may review:

- Products
- Sellers

These are treated as separate business entities.

---

# Notifications

Notifications inform Users about important events.

Examples:

Customer:

- Order Confirmed
- Order Shipped
- Stock Available

Seller:

- New Order
- New Review
- Low Stock

Admin:

- New Seller Registration
- Reported Product

---

# Wishlist (Optional)

Customers may save products for future purchases.

```
Customer

↓

Wishlist

↓

Products
```

---

# Domain Overview

```
User
│
├── Store
│      │
│      ├── Product
│      │       │
│      │       ├── ProductImage
│      │       ├── ProductVariant
│      │       ├── Category
│      │       ├── Tag
│      │       └── Review
│      │
│      └── StoreReview
│
├── Cart
│      └── CartItem
│
├── Wishlist
│
├── Address
│
├── Purchase
│      │
│      ├── Payment
│      │
│      └── SellerOrder
│              │
│              ├── OrderItem
│              │
│              └── Shipment
│
└── Notification
```

---

# Architecture Decisions

- Single User entity.
- One role per User.
- One Seller owns one Store.
- One Store owns many Products.
- Products support multiple Images.
- Products support Variants.
- Categories are hierarchical.
- Tags are independent from Categories.
- Products remain visible when out of stock.
- Customers may subscribe to Stock Alerts.
- One Checkout creates one Purchase.
- One Purchase creates multiple Seller Orders.
- One Payment per Purchase.
- One Shipment per Seller Order.