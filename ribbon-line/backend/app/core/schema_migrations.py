from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


PRODUCT_COLUMNS: dict[str, str] = {
    "sku": "VARCHAR(80)",
    "barcode": "VARCHAR(120)",
    "description": "TEXT",
    "supplier_name": "VARCHAR(160)",
    "max_capacity": "INTEGER NOT NULL DEFAULT 0",
    "standard_pack_size": "INTEGER NOT NULL DEFAULT 1",
    "total_units_sold": "INTEGER NOT NULL DEFAULT 0",
    "total_income_generated": "NUMERIC(14, 2) NOT NULL DEFAULT 0",
    "last_movement_date": "DATETIME",
}

INVENTORY_INDEXES: tuple[str, ...] = (
    "CREATE INDEX IF NOT EXISTS ix_products_sku ON products (sku)",
    "CREATE INDEX IF NOT EXISTS ix_products_barcode ON products (barcode)",
    "CREATE INDEX IF NOT EXISTS ix_products_supplier_name ON products (supplier_name)",
    "CREATE INDEX IF NOT EXISTS ix_products_inventory_active_updated ON products (is_archived, updated_at)",
    "CREATE INDEX IF NOT EXISTS ix_products_inventory_category ON products (category_id, is_archived)",
    "CREATE INDEX IF NOT EXISTS ix_stock_movements_product_created ON stock_movements (product_id, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_stock_movements_type_created ON stock_movements (type, created_at)",
)


def ensure_inventory_schema(engine: Engine) -> None:
    """Apply lightweight additive schema updates for local SQLite installs.

    The project does not have Alembic wired yet. These additive DDL statements
    keep existing local databases usable while preserving column definitions
    that can move cleanly into formal PostgreSQL migrations later.
    """

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    if "products" not in existing_tables:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("products")}
    with engine.begin() as conn:
        for column_name, ddl_type in PRODUCT_COLUMNS.items():
            if column_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE products ADD COLUMN {column_name} {ddl_type}"))

        if "stock_movements" in existing_tables:
            for statement in INVENTORY_INDEXES:
                conn.execute(text(statement))

