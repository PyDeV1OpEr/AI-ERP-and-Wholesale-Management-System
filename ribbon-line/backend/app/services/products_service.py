from __future__ import annotations

import uuid
from pathlib import Path
from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.media import normalize_stored_image_path, to_public_image_url
from app.models.products import Brand, Category, Product, ProductPackagingConversion, ProductUnit
from app.repositories.products_repository import ProductsRepository
from app.schemas.products import (
    BrandCreate,
    BrandRead,
    CategoryCreate,
    CategoryRead,
    ProductArchiveUpdate,
    ProductCreate,
    ProductListResponse,
    ProductPackagingConversionRead,
    ProductPackagingLevelInput,
    ProductRead,
    ProductUnitRead,
    ProductUpdate,
)

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "products"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


class ProductsService:
    def __init__(self, db: Session):
        self.repo = ProductsRepository(db)
        self.db = db

    def list_products(
        self,
        *,
        include_archived: bool,
        search: str | None,
        brand_id: int | None,
        category_id: int | None,
    ) -> ProductListResponse:
        items, total = self.repo.list_products(
            include_archived=include_archived,
            search=search,
            brand_id=brand_id,
            category_id=category_id,
        )
        return ProductListResponse(items=[self._to_product_read(item) for item in items], total=total)

    def create_product(self, payload: ProductCreate) -> ProductRead:
        self._validate_brand_category(payload.brand_id, payload.category_id)
        product = Product(
            name=payload.name.strip(),
            brand_id=payload.brand_id,
            category_id=payload.category_id,
            base_unit=payload.base_unit.strip(),
            selling_price=payload.selling_price,
            cost_price=payload.cost_price,
            image_url=normalize_stored_image_path(payload.image_url),
            is_active=payload.is_active,
            is_archived=False,
        )
        self.repo.add_product(product)
        self._sync_unit_hierarchy(product.id, payload.base_unit, payload.packaging_levels)
        self.db.commit()
        return self._fetch_or_404(product.id)

    def update_product(self, product_id: int, payload: ProductUpdate) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        self._validate_brand_category(payload.brand_id, payload.category_id)
        product.name = payload.name.strip()
        product.brand_id = payload.brand_id
        product.category_id = payload.category_id
        product.base_unit = payload.base_unit.strip()
        product.selling_price = payload.selling_price
        product.cost_price = payload.cost_price
        product.image_url = normalize_stored_image_path(payload.image_url)
        product.is_active = payload.is_active
        product.is_archived = payload.is_archived

        self.repo.delete_product_relations(product_id)
        self._sync_unit_hierarchy(product_id, payload.base_unit, payload.packaging_levels)
        self.db.commit()
        return self._fetch_or_404(product_id)

    def update_archive_status(self, product_id: int, payload: ProductArchiveUpdate) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        product.is_archived = payload.is_archived
        self.db.commit()
        return self._fetch_or_404(product_id)

    def list_brands(self) -> list[BrandRead]:
        return [BrandRead.model_validate(item) for item in self.repo.list_brands()]

    def create_brand(self, payload: BrandCreate) -> BrandRead:
        existing = self.repo.get_brand_by_name(payload.name.strip())
        if existing:
            return BrandRead.model_validate(existing)
        brand = self.repo.add_brand(Brand(name=payload.name.strip()))
        self.db.commit()
        return BrandRead.model_validate(brand)

    def list_categories(self) -> list[CategoryRead]:
        return [CategoryRead.model_validate(item) for item in self.repo.list_categories()]

    def create_category(self, payload: CategoryCreate) -> CategoryRead:
        existing = self.repo.get_category_by_name(payload.name.strip())
        if existing:
            return CategoryRead.model_validate(existing)
        category = self.repo.add_category(Category(name=payload.name.strip()))
        self.db.commit()
        return CategoryRead.model_validate(category)

    async def upload_product_image(self, image: UploadFile) -> str:
        allowed_types = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
        allowed_suffixes = {".png", ".jpg", ".jpeg", ".webp"}

        suffix = Path(image.filename or "image.jpg").suffix.lower() or ".jpg"
        if image.content_type not in allowed_types and suffix not in allowed_suffixes:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported image type")

        filename = f"{uuid.uuid4().hex}{suffix}"
        output_path = UPLOADS_DIR / filename
        content = await image.read()
        if not content:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded image file is empty")

        output_path.write_bytes(content)
        stored_path = f"/uploads/products/{filename}"
        return to_public_image_url(stored_path) or stored_path

    def _validate_brand_category(self, brand_id: int, category_id: int | None) -> None:
        brands = {item.id for item in self.repo.list_brands()}
        if brand_id not in brands:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid brand_id")
        if category_id is not None:
            categories = {item.id for item in self.repo.list_categories()}
            if category_id not in categories:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid category_id")

    def _sync_unit_hierarchy(
        self,
        product_id: int,
        base_unit: str,
        packaging_levels: list[ProductPackagingLevelInput],
    ) -> None:
        units: list[ProductUnit] = [ProductUnit(product_id=product_id, name=base_unit.strip(), is_base=True, level=0)]
        current_level = 1
        for level in packaging_levels:
            units.append(
                ProductUnit(
                    product_id=product_id,
                    name=level.unit_name.strip(),
                    is_base=False,
                    level=current_level,
                )
            )
            current_level += 1

        self.repo.add_units(units)
        unit_map = {unit.name.lower(): unit for unit in units}
        conversions: list[ProductPackagingConversion] = []
        child_name = base_unit.strip()
        for level in packaging_levels:
            parent = unit_map[level.unit_name.strip().lower()]
            child = unit_map[child_name.strip().lower()]
            conversions.append(
                ProductPackagingConversion(
                    product_id=product_id,
                    parent_unit_id=parent.id,
                    child_unit_id=child.id,
                    quantity=level.contains,
                )
            )
            child_name = level.unit_name
        self.repo.add_conversions(conversions)

    def _build_packaging_summary(self, product: Product) -> str:
        if not product.conversions:
            return f"Base: {product.base_unit}"
        ordered = sorted(product.conversions, key=lambda c: c.parent_unit.level)
        parts = [f"{item.parent_unit.name} = {item.quantity} {item.child_unit.name}" for item in ordered]
        return " | ".join(parts)

    def _to_product_read(self, product: Product) -> ProductRead:
        conversions = [
            ProductPackagingConversionRead(
                id=item.id,
                parent_unit_id=item.parent_unit_id,
                child_unit_id=item.child_unit_id,
                parent_unit_name=item.parent_unit.name,
                child_unit_name=item.child_unit.name,
                quantity=item.quantity,
            )
            for item in sorted(product.conversions, key=lambda c: c.parent_unit.level)
        ]
        return ProductRead(
            id=product.id,
            name=product.name,
            brand_id=product.brand_id,
            brand_name=product.brand.name,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            base_unit=product.base_unit,
            selling_price=product.selling_price,
            cost_price=product.cost_price,
            image_url=to_public_image_url(product.image_url),
            is_active=product.is_active,
            is_archived=product.is_archived,
            packaging_summary=self._build_packaging_summary(product),
            units=[ProductUnitRead.model_validate(unit) for unit in sorted(product.units, key=lambda u: u.level)],
            conversions=conversions,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    def _fetch_or_404(self, product_id: int) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        return self._to_product_read(product)
