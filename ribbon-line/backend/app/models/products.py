from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, Integer, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Brand(Base):
    __tablename__ = "brands"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    products: Mapped[list["Product"]] = relationship(back_populates="brand")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_inventory_active_updated", "is_archived", "updated_at"),
        Index("ix_products_inventory_category", "category_id", "is_archived"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sku: Mapped[str | None] = mapped_column(String(80), nullable=True, index=True)
    barcode: Mapped[str | None] = mapped_column(String(120), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand_id: Mapped[int] = mapped_column(ForeignKey("brands.id"), nullable=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    supplier_name: Mapped[str | None] = mapped_column(String(160), nullable=True, index=True)
    base_unit: Mapped[str] = mapped_column(String(80), nullable=False)
    selling_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    cost_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_capacity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    standard_pack_size: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    total_units_sold: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_income_generated: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    last_movement_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    brand: Mapped[Brand] = relationship(back_populates="products")
    category: Mapped[Category | None] = relationship(back_populates="products")
    units: Mapped[list["ProductUnit"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        foreign_keys="ProductUnit.product_id",
    )
    conversions: Mapped[list["ProductPackagingConversion"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
    )
    stock_movements: Mapped[list["StockMovement"]] = relationship(
        back_populates="product",
        cascade="all, delete-orphan",
        order_by="StockMovement.created_at.desc()",
    )


class ProductUnit(Base):
    __tablename__ = "product_units"
    __table_args__ = (UniqueConstraint("product_id", "name", name="uq_product_unit_name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    is_base: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    product: Mapped[Product] = relationship(back_populates="units", foreign_keys=[product_id])


class ProductPackagingConversion(Base):
    __tablename__ = "product_packaging_conversions"
    __table_args__ = (
        UniqueConstraint("product_id", "parent_unit_id", "child_unit_id", name="uq_product_conversion"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    parent_unit_id: Mapped[int] = mapped_column(ForeignKey("product_units.id", ondelete="CASCADE"), nullable=False)
    child_unit_id: Mapped[int] = mapped_column(ForeignKey("product_units.id", ondelete="CASCADE"), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    product: Mapped[Product] = relationship(back_populates="conversions")
    parent_unit: Mapped[ProductUnit] = relationship(foreign_keys=[parent_unit_id])
    child_unit: Mapped[ProductUnit] = relationship(foreign_keys=[child_unit_id])


class StockMovement(Base):
    __tablename__ = "stock_movements"
    __table_args__ = (
        Index("ix_stock_movements_product_created", "product_id", "created_at"),
        Index("ix_stock_movements_type_created", "type", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    product: Mapped[Product] = relationship(back_populates="stock_movements")
