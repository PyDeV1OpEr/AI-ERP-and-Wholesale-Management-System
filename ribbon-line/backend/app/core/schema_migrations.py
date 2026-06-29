from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


PRODUCT_COLUMNS: dict[str, str] = {
    "sku": "VARCHAR(80)",
    "barcode": "VARCHAR(120)",
    "description": "TEXT",
    "supplier_name": "VARCHAR(160)",
    "main_unit_name": "VARCHAR(80) NOT NULL DEFAULT 'Box'",
    "base_unit_name": "VARCHAR(80) NOT NULL DEFAULT 'Unit'",
    "conversion_factor": "INTEGER NOT NULL DEFAULT 1",
    "stock_location": "VARCHAR(160)",
    "reserved_stock_quantity": "INTEGER NOT NULL DEFAULT 0",
    "max_capacity": "INTEGER NOT NULL DEFAULT 0",
    "standard_pack_size": "INTEGER NOT NULL DEFAULT 1",
    "total_units_sold": "INTEGER NOT NULL DEFAULT 0",
    "total_income_generated": "NUMERIC(14, 2) NOT NULL DEFAULT 0",
    "last_movement_date": "DATETIME",
    "status": "VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'",
    "archived_at": "DATETIME",
    "deleted_at": "DATETIME",
}

ORDER_ITEM_COLUMNS: dict[str, str] = {
    "reserved_quantity_base": "INTEGER NOT NULL DEFAULT 0",
}

STOCK_MOVEMENT_COLUMNS: dict[str, str] = {
    "previous_quantity": "INTEGER NOT NULL DEFAULT 0",
    "new_quantity": "INTEGER NOT NULL DEFAULT 0",
    "movement_type": "VARCHAR(32) NOT NULL DEFAULT 'ADJUSTMENT'",
    "reference": "VARCHAR(160)",
}

INVENTORY_INDEXES: tuple[str, ...] = (
    "CREATE INDEX IF NOT EXISTS ix_products_sku ON products (sku)",
    "CREATE INDEX IF NOT EXISTS ix_products_barcode ON products (barcode)",
    "CREATE INDEX IF NOT EXISTS ix_products_supplier_name ON products (supplier_name)",
    "CREATE INDEX IF NOT EXISTS ix_products_status ON products (status)",
    "CREATE INDEX IF NOT EXISTS ix_products_status_updated ON products (status, updated_at)",
    "CREATE INDEX IF NOT EXISTS ix_products_inventory_category_status ON products (category_id, status)",
    "CREATE INDEX IF NOT EXISTS ix_inventory_records_product ON inventory_records (product_id)",
    "CREATE INDEX IF NOT EXISTS ix_stock_movements_product_created ON stock_movements (product_id, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_stock_movements_type_created ON stock_movements (type, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_stock_movements_movement_type_created ON stock_movements (movement_type, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_product_lifecycle_logs_product_created ON product_lifecycle_logs (product_id, created_at)",
    "CREATE INDEX IF NOT EXISTS ix_product_lifecycle_logs_action_created ON product_lifecycle_logs (action, created_at)",
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

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS inventory_records (
                    id INTEGER NOT NULL PRIMARY KEY,
                    product_id INTEGER NOT NULL UNIQUE,
                    quantity_base_unit INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    CONSTRAINT ck_inventory_quantity_non_negative CHECK (quantity_base_unit >= 0),
                    FOREIGN KEY(product_id) REFERENCES products (id) ON DELETE CASCADE
                )
                """
            )
        )
        conn.execute(
            text(
                """
                INSERT INTO inventory_records (product_id, quantity_base_unit)
                SELECT products.id, COALESCE(products.stock_quantity, 0)
                FROM products
                LEFT JOIN inventory_records ON inventory_records.product_id = products.id
                WHERE inventory_records.product_id IS NULL
                """
            )
        )

        if "stock_movements" in existing_tables:
            movement_columns = {column["name"] for column in inspector.get_columns("stock_movements")}
            for column_name, ddl_type in STOCK_MOVEMENT_COLUMNS.items():
                if column_name not in movement_columns:
                    conn.execute(text(f"ALTER TABLE stock_movements ADD COLUMN {column_name} {ddl_type}"))

            conn.execute(
                text(
                    """
                    UPDATE stock_movements
                    SET movement_type = CASE
                        WHEN lower(type) = 'received' THEN 'STOCK_IN'
                        WHEN lower(type) = 'sent' THEN 'STOCK_OUT'
                        WHEN lower(type) = 'adjusted' THEN 'ADJUSTMENT'
                        WHEN lower(type) = 'opening_stock' THEN 'OPENING_STOCK'
                        ELSE movement_type
                    END
                    WHERE movement_type = 'ADJUSTMENT' OR movement_type IS NULL
                    """
                )
            )
            conn.execute(text("UPDATE stock_movements SET quantity = abs(quantity) WHERE quantity < 0"))

        conn.execute(text("UPDATE products SET base_unit_name = base_unit WHERE base_unit_name = 'Unit' AND base_unit IS NOT NULL"))

        conn.execute(
            text(
                """
                UPDATE products
                SET status = CASE
                    WHEN is_archived = 1 THEN 'ARCHIVED'
                    ELSE 'ACTIVE'
                END
                WHERE status IS NULL OR status = 'ACTIVE'
                """
            )
        )
        conn.execute(
            text(
                """
                UPDATE products
                SET archived_at = updated_at
                WHERE status = 'ARCHIVED' AND archived_at IS NULL
                """
            )
        )

        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS product_lifecycle_logs (
                    id INTEGER NOT NULL PRIMARY KEY,
                    product_id INTEGER,
                    product_name VARCHAR(160) NOT NULL,
                    action VARCHAR(32) NOT NULL,
                    actor VARCHAR(120),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
                )
                """
            )
        )

        for statement in INVENTORY_INDEXES:
            conn.execute(text(statement))

CUSTOMER_COLUMNS: dict[str, str] = {
    "customer_code": "VARCHAR(20)",
    "customer_type": "VARCHAR(20) NOT NULL DEFAULT 'RETAIL'",
    "credit_limit": "NUMERIC(14, 2) NOT NULL DEFAULT 0",
    "company_name": "VARCHAR(200)",
    "whatsapp_number": "VARCHAR(50)",
    "city": "VARCHAR(100)",
    "country": "VARCHAR(100)",
    "postal_code": "VARCHAR(20)",
}

def ensure_customer_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    if "customers" not in existing_tables:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("customers")}
    with engine.begin() as conn:
        for column_name, ddl_type in CUSTOMER_COLUMNS.items():
            if column_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE customers ADD COLUMN {column_name} {ddl_type}"))

        # Populate customer_code for existing records to ensure uniqueness
        conn.execute(
            text(
                """
                UPDATE customers 
                SET customer_code = printf('CUS-%04d', id) 
                WHERE customer_code IS NULL
                """
            )
        )

        # Create the unique index separately
        conn.execute(
            text(
                """
                CREATE UNIQUE INDEX IF NOT EXISTS ix_customers_code 
                ON customers (customer_code)
                """
            )
        )


def ensure_order_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())
    if "order_items" not in existing_tables:
        return

    existing_columns = {column["name"] for column in inspector.get_columns("order_items")}
    with engine.begin() as conn:
        for column_name, ddl_type in ORDER_ITEM_COLUMNS.items():
            if column_name not in existing_columns:
                conn.execute(text(f"ALTER TABLE order_items ADD COLUMN {column_name} {ddl_type}"))
