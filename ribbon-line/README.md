# RIBBON LINE - AI ERP & WHOLESALE MANAGEMENT SYSTEM

Production-grade ERP foundation focused on product master data, inventory control, and scalable stock movement tracking with clean service-layer architecture.

## Project Overview

Ribbon Line provides a modular ERP core for wholesale operations with:

- Product master management (brands, categories, pricing, unit configuration)
- Inventory management with base-unit internal storage
- Dynamic unit conversion display across APIs and UI
- Inventory movement history for auditability and analytics
- Built-in product icon catalog plus custom image uploads

The system is currently running on SQLite for local/offline development and is designed to remain PostgreSQL-compatible through SQLAlchemy ORM patterns.

## Core Features

- Product create/edit with `main_unit_name`, `base_unit_name`, and `conversion_factor`
- Inventory list/detail powered by `inventory_records.quantity_base_unit`
- Stock operations (`add`, `remove`, `adjust`) with automatic movement creation
- Movement timeline and analytics (`OPENING_STOCK`, `STOCK_IN`, `STOCK_OUT`, `ADJUSTMENT`)
- Product lifecycle management (`ACTIVE` → `ARCHIVED` → permanent delete)
- Product Archive Manager at `/archived-products`
- Professional icon picker with 8 categories:
  - Stationery
  - Floral
  - Ribbon
  - Textile
  - Electronics
  - Tools
  - Office
  - Miscellaneous

## Technology Stack

- Backend: FastAPI, SQLAlchemy ORM, Pydantic
- Database: SQLite (active), PostgreSQL-ready schema/model design
- Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
- Tooling: Framer Motion, Lucide, reusable typed API clients

## Folder Structure

```text
ribbon-line/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── schema_migrations.py
│   │   │   ├── seed.py
│   │   │   └── media.py
│   │   ├── models/
│   │   │   ├── products.py
│   │   │   └── dashboard.py
│   │   ├── repositories/
│   │   │   └── products_repository.py
│   │   ├── routes/
│   │   │   ├── products.py
│   │   │   ├── inventory.py
│   │   │   └── dashboard.py
│   │   ├── schemas/
│   │   │   ├── products.py
│   │   │   ├── inventory.py
│   │   │   └── dashboard.py
│   │   ├── services/
│   │   │   ├── products_service.py
│   │   │   ├── inventory_service.py
│   │   │   └── dashboard_service.py
│   │   ├── utils/
│   │   │   └── inventory_conversion.py
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   │   ├── inventory-api.ts
│   │   ├── products-api.ts
│   │   ├── product-icons.ts
│   │   └── product-image.ts
│   ├── types/
│   │   ├── inventory.ts
│   │   └── products.ts
│   ├── utils/
│   │   └── inventoryConversion.ts
│   └── public/assets/product-icons/
├── start.py
└── README.md
```

## Inventory Architecture

### Source of truth

- Product unit configuration lives in the product master (`products`, `product_units`, `product_packaging_conversions`).
- Inventory does not duplicate unit definitions.
- Inventory quantity is stored only in base units (`inventory_records.quantity_base_unit`).

### Why this model

- Prevents synchronization drift between product setup and inventory.
- Keeps stock arithmetic deterministic.
- Supports future multi-database portability with normalized relationships.

## Unit Conversion System

### Business rule

Never store converted totals (e.g., boxes/cartons/rolls) as separate stock fields.
Store only base-unit quantity and derive display values dynamically.

### Reusable utilities

- Backend: `backend/app/utils/inventory_conversion.py`
- Frontend: `frontend/utils/inventoryConversion.ts`

Example:

- Input: `quantity=2282`, `conversion_factor=144`, `main_unit_name=Box`, `base_unit_name=Roll`
- Output: `15 Boxes + 122 Rolls`

## Database Design

### Key inventory tables

- `products`
  - unit master (`main_unit_name`, `base_unit_name`, `conversion_factor`)
  - lifecycle status (`status`, `archived_at`, `deleted_at`)
  - soft archive via `status = ARCHIVED` (stock preserved)
- `inventory_records`
  - one row per product
  - `quantity_base_unit` as canonical stock
- `stock_movements`
  - immutable history: previous/new quantity, movement type, notes/reference
- `product_units` and `product_packaging_conversions`
  - product-level packaging hierarchy and conversion map

### Data integrity

- Positive conversion factor constraint
- Non-negative inventory quantity constraint
- Indexed inventory and movement queries for scale

## API Structure

### Products

- `GET /products` (active only)
- `GET /products/archived`
- `POST /products`
- `PUT /products/{product_id}`
- `POST /products/{product_id}/archive`
- `POST /products/{product_id}/restore`
- `DELETE /products/{product_id}` (archived products only)
- `GET /products/brands`, `POST /products/brands`
- `GET /products/categories`, `POST /products/categories`
- `POST /products/upload-image`

### Inventory

- `GET /inventory`
- `GET /inventory/{product_id}`
- `PATCH /inventory/{product_id}/settings`
- `POST /inventory/{product_id}/stock-operations`
- `GET /inventory/{product_id}/movements`
- `GET /inventory/{product_id}/analytics`

## Setup Guide

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2) Frontend

```bash
cd frontend
npm install
cd ..
```

### 3) Run both services

```bash
python start.py
```

Default URLs:

- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:3000`

## Development Workflow

1. Update SQLAlchemy models/schemas/services first.
2. Keep route handlers thin; place business logic in services.
3. Update frontend types and API clients before component integration.
4. Reuse conversion/image helper utilities across features.
5. Validate via API smoke tests and frontend type checks.

## PostgreSQL Migration Notes

- Current code intentionally uses SQLAlchemy ORM abstractions compatible with PostgreSQL.
- Avoid SQLite-specific behavior in domain logic; keep vendor-specific handling isolated.
- `schema_migrations.py` currently provides additive bootstrap updates for local SQLite databases until full migration tooling is introduced.
- Recommended next step: introduce Alembic baseline and promote additive schema changes into formal migration revisions.

## Performance and Scaling Notes

- Inventory list uses SQL-level filtering, pagination, and aggregate expressions.
- `selectinload` is used to avoid N+1 on relation-heavy reads.
- Movement queries are indexed by product and timestamp for 100k+ history growth.
- Frontend inventory panels use dynamic loading and memoization to reduce render cost.
