# RIBBON LINE

Production-grade foundation for an offline-first AI-powered ERP + Wholesale Management System.

## Stack

- Backend: FastAPI, SQLAlchemy, PostgreSQL/SQLite, Pydantic
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide
- Startup: Single command launcher via `start.py`

## Architecture Goals

- Offline-first local mode (self-hosted on-device)
- Cloud-deployable later without major rewrites
- Modular backend service/router/schema layers
- Typed frontend dashboard and products module with reusable components
- Demo-safe data for public repository usage

## Folder Structure

```text
ribbon-line/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/dashboard.py
│   │   ├── models/products.py
│   │   ├── repositories/products_repository.py
│   │   ├── routes/dashboard.py
│   │   ├── routes/products.py
│   │   ├── schemas/dashboard.py
│   │   ├── schemas/products.py
│   │   ├── services/dashboard_service.py
│   │   └── services/products_service.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/dashboard/page.tsx
│   ├── app/products/page.tsx
│   ├── components/dashboard/*
│   ├── components/products/*
│   ├── lib/api.ts
│   ├── lib/products-api.ts
│   ├── lib/dashboard-data.ts
│   ├── types/dashboard.ts
│   ├── types/products.ts
│   └── package.json
├── start.py
├── .env.example
└── README.md
```

## Local Setup

### 1) Backend dependencies

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
```

### 2) Frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3) Start both services with one command

```bash
python start.py
```

You will get:
- Backend: `http://127.0.0.1:8000`
- Frontend: `http://127.0.0.1:3000`

## Demo API Endpoints

- `GET /health`
- `GET /dashboard/stats`
- `GET /dashboard/orders`
- `GET /dashboard/activities`
- `GET /dashboard/insights`
- `GET /dashboard/stock`
- `GET /products`
- `POST /products`
- `PUT /products/{id}`
- `PATCH /products/{id}/archive`
- `GET /products/brands`
- `POST /products/brands`
- `GET /products/categories`
- `POST /products/categories`
- `POST /products/upload-image`

## Notes

- Current data is deterministic demo data for architecture validation.
- PostgreSQL is the primary DB path; SQLite remains available for fully offline mode.
- Product architecture supports base units + packaging hierarchies and is ready for future customer-specific pricing extension.
