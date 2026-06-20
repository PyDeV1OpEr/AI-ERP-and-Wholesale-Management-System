from __future__ import annotations

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.products import (
    Brand,
    Category,
    Product,
    ProductPackagingConversion,
    ProductStatus,
    ProductUnit,
)


class ProductsRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_products(
        self,
        *,
        status: str | None,
        search: str | None,
        brand_id: int | None,
        category_id: int | None,
    ) -> tuple[list[Product], int]:
        query: Select[tuple[Product]] = select(Product).options(
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.inventory_record),
            selectinload(Product.units),
            selectinload(Product.conversions).selectinload(ProductPackagingConversion.parent_unit),
            selectinload(Product.conversions).selectinload(ProductPackagingConversion.child_unit),
        )
        count_query = select(func.count(Product.id))

        if status:
            query = query.where(Product.status == status)
            count_query = count_query.where(Product.status == status)
        else:
            query = query.where(Product.status == ProductStatus.ACTIVE)
            count_query = count_query.where(Product.status == ProductStatus.ACTIVE)

        if search:
            search_clause = or_(
                Product.name.ilike(f"%{search}%"),
                Brand.name.ilike(f"%{search}%"),
            )
            query = query.join(Product.brand).where(search_clause)
            count_query = count_query.join(Product.brand).where(search_clause)

        if brand_id is not None:
            query = query.where(Product.brand_id == brand_id)
            count_query = count_query.where(Product.brand_id == brand_id)

        if category_id is not None:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)

        if status == ProductStatus.ARCHIVED:
            query = query.order_by(Product.archived_at.desc(), Product.updated_at.desc())
        else:
            query = query.order_by(Product.updated_at.desc())

        items = self.db.execute(query).scalars().all()
        total = self.db.execute(count_query).scalar_one()
        return items, total

    def get_product(self, product_id: int) -> Product | None:
        query = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.brand),
                selectinload(Product.category),
                selectinload(Product.inventory_record),
                selectinload(Product.units),
                selectinload(Product.conversions).selectinload(ProductPackagingConversion.parent_unit),
                selectinload(Product.conversions).selectinload(ProductPackagingConversion.child_unit),
            )
        )
        return self.db.execute(query).scalars().first()

    def add_product(self, product: Product) -> Product:
        self.db.add(product)
        self.db.flush()
        return product

    def delete_product(self, product: Product) -> None:
        self.db.delete(product)
        self.db.flush()

    def delete_product_relations(self, product_id: int) -> None:
        self.db.query(ProductPackagingConversion).filter(ProductPackagingConversion.product_id == product_id).delete()
        self.db.query(ProductUnit).filter(ProductUnit.product_id == product_id).delete()

    def add_units(self, units: list[ProductUnit]) -> None:
        self.db.add_all(units)
        self.db.flush()

    def add_conversions(self, conversions: list[ProductPackagingConversion]) -> None:
        self.db.add_all(conversions)
        self.db.flush()

    def list_brands(self) -> list[Brand]:
        return self.db.execute(select(Brand).order_by(Brand.name.asc())).scalars().all()

    def get_brand_by_name(self, name: str) -> Brand | None:
        return self.db.execute(select(Brand).where(Brand.name.ilike(name))).scalars().first()

    def add_brand(self, brand: Brand) -> Brand:
        self.db.add(brand)
        self.db.flush()
        return brand

    def list_categories(self) -> list[Category]:
        return self.db.execute(select(Category).order_by(Category.name.asc())).scalars().all()

    def get_category_by_name(self, name: str) -> Category | None:
        return self.db.execute(select(Category).where(Category.name.ilike(name))).scalars().first()

    def add_category(self, category: Category) -> Category:
        self.db.add(category)
        self.db.flush()
        return category
