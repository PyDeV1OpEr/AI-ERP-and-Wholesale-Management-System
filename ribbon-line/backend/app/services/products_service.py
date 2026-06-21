from __future__ import annotations

import logging
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.media import normalize_stored_image_path, to_public_image_url
from app.models.product_lifecycle import ProductLifecycleLog
from app.models.products import (
    Brand,
    Category,
    InventoryRecord,
    Product,
    ProductPackagingConversion,
    ProductStatus,
    ProductUnit,
    StockMovement,
)
from app.repositories.products_repository import ProductsRepository
from app.schemas.products import (
    BrandCreate,
    BrandRead,
    CategoryCreate,
    CategoryRead,
    ProductCreate,
    ProductListResponse,
    ProductPackagingConversionRead,
    ProductRead,
    ProductUnitRead,
    ProductUpdate,
)

logger = logging.getLogger(__name__)

UPLOADS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "products"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

LIFECYCLE_ARCHIVE = "ARCHIVE"
LIFECYCLE_RESTORE = "RESTORE"
LIFECYCLE_PERMANENT_DELETE = "PERMANENT_DELETE"


class ProductsService:
    def __init__(self, db: Session):
        self.repo = ProductsRepository(db)
        self.db = db

    def list_products(
        self,
        *,
        status: str | None,
        search: str | None,
        brand_id: int | None,
        category_id: int | None,
        offset: int = 0,
        limit: int = 50,
    ) -> ProductListResponse:
        items, total = self.repo.list_products(
            status=status,
            search=search,
            brand_id=brand_id,
            category_id=category_id,
            offset=offset,
            limit=limit,
        )
        return ProductListResponse(items=[self._to_product_read(item) for item in items], total=total, offset=offset, limit=limit)

    def list_archived_products(
        self,
        *,
        search: str | None,
        brand_id: int | None,
        category_id: int | None,
        offset: int = 0,
        limit: int = 50,
    ) -> ProductListResponse:
        return self.list_products(
            status=ProductStatus.ARCHIVED,
            search=search,
            brand_id=brand_id,
            category_id=category_id,
            offset=offset,
            limit=limit,
        )

    def create_product(self, payload: ProductCreate) -> ProductRead:
        self._validate_brand_category(payload.brand_id, payload.category_id)
        product = Product(
            name=payload.name.strip(),
            brand_id=payload.brand_id,
            category_id=payload.category_id,
            base_unit=payload.base_unit_name.strip(),
            main_unit_name=payload.main_unit_name.strip(),
            base_unit_name=payload.base_unit_name.strip(),
            conversion_factor=payload.conversion_factor,
            selling_price=payload.selling_price,
            cost_price=payload.cost_price,
            image_url=normalize_stored_image_path(payload.image_url),
            is_active=payload.is_active,
            status=ProductStatus.ACTIVE,
            is_archived=False,
        )
        self.repo.add_product(product)
        self.db.add(InventoryRecord(product_id=product.id, quantity_base_unit=0))
        self._sync_unit_hierarchy(
            product.id,
            payload.base_unit_name,
            payload.main_unit_name,
            payload.conversion_factor,
        )
        self.db.commit()
        return self._fetch_or_404(product.id)

    def update_product(self, product_id: int, payload: ProductUpdate) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.status != ProductStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active products can be edited. Restore the product first.",
            )

        self._validate_brand_category(payload.brand_id, payload.category_id)
        product.name = payload.name.strip()
        product.brand_id = payload.brand_id
        product.category_id = payload.category_id
        product.base_unit = payload.base_unit_name.strip()
        product.main_unit_name = payload.main_unit_name.strip()
        product.base_unit_name = payload.base_unit_name.strip()
        product.conversion_factor = payload.conversion_factor
        product.selling_price = payload.selling_price
        product.cost_price = payload.cost_price
        product.image_url = normalize_stored_image_path(payload.image_url)
        product.is_active = payload.is_active

        self.repo.delete_product_relations(product_id)
        if product.inventory_record is None:
            self.db.add(InventoryRecord(product_id=product.id, quantity_base_unit=max(product.stock_quantity or 0, 0)))
        self._sync_unit_hierarchy(
            product_id,
            payload.base_unit_name,
            payload.main_unit_name,
            payload.conversion_factor,
        )
        self.db.commit()
        return self._fetch_or_404(product_id)

    def archive_product(self, product_id: int, *, actor: str | None = None) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.status != ProductStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only active products can be archived.",
            )

        now = datetime.utcnow()
        product.status = ProductStatus.ARCHIVED
        product.is_archived = True
        product.archived_at = now
        product.updated_at = now

        self._log_lifecycle_action(
            product_id=product.id,
            product_name=product.name,
            action=LIFECYCLE_ARCHIVE,
            actor=actor,
        )
        self.db.commit()
        logger.info("Product archived: id=%s name=%s", product.id, product.name)
        return self._fetch_or_404(product_id)

    def restore_product(self, product_id: int, *, actor: str | None = None) -> ProductRead:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.status != ProductStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only archived products can be restored.",
            )

        now = datetime.utcnow()
        product.status = ProductStatus.ACTIVE
        product.is_archived = False
        product.archived_at = None
        product.updated_at = now

        self._log_lifecycle_action(
            product_id=product.id,
            product_name=product.name,
            action=LIFECYCLE_RESTORE,
            actor=actor,
        )
        self.db.commit()
        logger.info("Product restored: id=%s name=%s", product.id, product.name)
        return self._fetch_or_404(product_id)

    def permanently_delete_product(self, product_id: int, *, actor: str | None = None) -> None:
        product = self.repo.get_product(product_id)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        if product.status != ProductStatus.ARCHIVED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only archived products can be permanently deleted.",
            )

        product_name = product.name
        image_path = product.image_url

        self._log_lifecycle_action(
            product_id=product.id,
            product_name=product_name,
            action=LIFECYCLE_PERMANENT_DELETE,
            actor=actor,
        )

        self.db.query(StockMovement).filter(StockMovement.product_id == product_id).delete()
        self.db.query(InventoryRecord).filter(InventoryRecord.product_id == product_id).delete()
        self.repo.delete_product_relations(product_id)
        self.repo.delete_product(product)
        self.db.commit()

        self._delete_uploaded_image(image_path)
        logger.info("Product permanently deleted: id=%s name=%s", product_id, product_name)

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
        main_unit: str,
        conversion_factor: int,
    ) -> None:
        base_unit = base_unit.strip()
        main_unit = main_unit.strip()
        if base_unit.lower() == main_unit.lower():
            self.repo.add_units([ProductUnit(product_id=product_id, name=base_unit, is_base=True, level=0)])
            return

        units: list[ProductUnit] = [
            ProductUnit(product_id=product_id, name=base_unit, is_base=True, level=0),
            ProductUnit(product_id=product_id, name=main_unit, is_base=False, level=1),
        ]

        self.repo.add_units(units)
        unit_map = {unit.name.lower(): unit for unit in units}
        conversions: list[ProductPackagingConversion] = [
            ProductPackagingConversion(
                product_id=product_id,
                parent_unit_id=unit_map[main_unit.lower()].id,
                child_unit_id=unit_map[base_unit.lower()].id,
                quantity=conversion_factor,
            )
        ]
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
            main_unit_name=product.main_unit_name,
            base_unit_name=product.base_unit_name,
            conversion_factor=product.conversion_factor,
            selling_price=product.selling_price,
            cost_price=product.cost_price,
            image_url=to_public_image_url(product.image_url),
            is_active=product.is_active,
            status=product.status,
            is_archived=product.status == ProductStatus.ARCHIVED,
            archived_at=product.archived_at,
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

    def _log_lifecycle_action(
        self,
        *,
        product_id: int,
        product_name: str,
        action: str,
        actor: str | None,
    ) -> None:
        self.db.add(
            ProductLifecycleLog(
                product_id=product_id,
                product_name=product_name,
                action=action,
                actor=actor,
            )
        )

    def _delete_uploaded_image(self, image_path: str | None) -> None:
        if not image_path:
            return
        normalized = normalize_stored_image_path(image_path)
        if not normalized or not normalized.startswith("/uploads/products/"):
            return
        filename = Path(normalized).name
        file_path = UPLOADS_DIR / filename
        if file_path.exists():
            file_path.unlink(missing_ok=True)
