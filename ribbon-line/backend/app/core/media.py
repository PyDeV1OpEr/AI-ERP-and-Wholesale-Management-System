"""Unified media URL helpers — store relative paths, serve absolute URLs."""

from __future__ import annotations

import os
from urllib.parse import urlparse
from enum import Enum

PUBLIC_API_BASE_URL = os.getenv("PUBLIC_API_BASE_URL", "http://127.0.0.1:8000").rstrip("/")


class IconType(str, Enum):
    SVG = "svg"
    EMOJI = "emoji"
    UPLOAD = "upload"


def normalize_stored_image_path(image_url: str | None) -> str | None:
    """Persist a portable relative path in the database."""
    if not image_url or not image_url.strip():
        return None

    value = image_url.strip()
    if value.startswith(("http://", "https://")):
        parsed = urlparse(value)
        return parsed.path or None

    return value if value.startswith("/") else f"/{value}"


def to_public_image_url(stored_path: str | None) -> str | None:
    """Return a browser-accessible absolute URL for API responses and uploads."""
    if not stored_path or not stored_path.strip():
        return None

    value = stored_path.strip()
    if value.startswith(("http://", "https://")):
        return value

    path = value if value.startswith("/") else f"/{value}"
    return f"{PUBLIC_API_BASE_URL}{path}"


def resolve_asset_url(
    icon_type: str | None,
    icon_value: str | None,
    fallback: str | None = None,
) -> str | None:
    """Unified resolver for all asset types."""
    if not icon_type or not icon_value:
        return fallback

    if icon_type == IconType.SVG:
        return f"/assets/product-icons/{icon_value}.svg"
    elif icon_type == IconType.UPLOAD:
        normalized = normalize_stored_image_path(icon_value)
        return to_public_image_url(normalized)
    elif icon_type == IconType.EMOJI:
        return icon_value

    return fallback
