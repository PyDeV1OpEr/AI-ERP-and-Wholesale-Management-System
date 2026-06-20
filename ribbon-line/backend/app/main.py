"""FastAPI application entrypoint for RIBBON LINE backend."""

from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import Base, SessionLocal, engine
from app.core.schema_migrations import ensure_inventory_schema
from app.core.seed import seed_demo_data
from app.models import product_lifecycle  # noqa: F401 — register lifecycle log table
from app.routes.dashboard import router as dashboard_router
from app.routes.inventory import router as inventory_router
from app.routes.products import router as products_router
from app.services.products_service import UPLOADS_DIR


def _cors_origins() -> list[str]:
    configured = os.getenv("CORS_ORIGINS")
    if configured:
        return [origin.strip() for origin in configured.split(",") if origin.strip()]
    return ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"]


def create_app() -> FastAPI:
    app = FastAPI(
        title="RIBBON LINE API",
        version="0.1.0",
        description="Offline-first ERP + Wholesale management API foundation.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=_cors_origins(),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def healthcheck():
        return {"status": "ok", "service": "ribbon-line-backend"}

    app.include_router(dashboard_router)
    app.include_router(products_router)
    app.include_router(inventory_router)
    uploads_root = UPLOADS_DIR.parent
    uploads_root.mkdir(parents=True, exist_ok=True)
    return app


app = create_app()
Base.metadata.create_all(bind=engine)
ensure_inventory_schema(engine)

if os.getenv("SEED_DEMO_DATA", "").lower() in {"1", "true", "yes"}:
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()
