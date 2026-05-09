"""FastAPI application entrypoint for RIBBON LINE backend."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routes.dashboard import router as dashboard_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="RIBBON LINE API",
        version="0.1.0",
        description="Offline-first ERP + Wholesale management API foundation.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["system"])
    def healthcheck():
        return {"status": "ok", "service": "ribbon-line-backend"}

    app.include_router(dashboard_router)
    return app


app = create_app()
Base.metadata.create_all(bind=engine)

