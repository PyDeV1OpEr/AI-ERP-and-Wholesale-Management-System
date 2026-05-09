# RIBBON LINE

Production-grade foundation for an offline-first AI-powered ERP + Wholesale Management System.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, Pydantic
- Frontend: Next.js 15 (App Router), TypeScript, Tailwind CSS, Framer Motion, Lucide
- Startup: Single command launcher via `start.py`

## Architecture Goals

- Offline-first local mode (self-hosted on-device)
- Cloud-deployable later without major rewrites
- Modular backend service/router/schema layers
- Typed frontend dashboard with reusable components
- Demo-safe data for public repository usage

## Folder Structure

```text
ribbon-line/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/dashboard.py
│   │   ├── routes/dashboard.py
│   │   ├── schemas/dashboard.py
│   │   └── services/dashboard_service.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── app/dashboard/page.tsx
│   ├── components/dashboard/*
│   ├── lib/api.ts
│   ├── lib/dashboard-data.ts
│   ├── types/dashboard.ts
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

## Notes

- Current data is deterministic demo data for architecture validation.
- SQLite is used by default for offline portability.
- To move to PostgreSQL/MySQL later, set `DATABASE_URL` and keep service contracts unchanged.
