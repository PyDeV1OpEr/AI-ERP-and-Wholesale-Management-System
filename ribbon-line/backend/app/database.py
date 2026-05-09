"""
Database configuration for RIBBON LINE backend.

This setup is intentionally SQLite-first for offline usage while keeping
the SQLAlchemy engine/session structure ready for future PostgreSQL/MySQL
migration with minimal code changes.
"""

from __future__ import annotations

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker


DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ribbon_line.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Provide a scoped DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
