from __future__ import annotations

from fastapi import APIRouter, Depends, File, Query, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.products import ProductStatus
from app.schemas.products import (
    BrandCreate,
    BrandRead,
    CategoryCreate,
    CategoryRead,
    ProductCreate,
    ProductImageUploadResponse,
    ProductListResponse,
    ProductRead,
    ProductUpdate,
)
from app.services.products_service import ProductsService

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
def list_products(
    search: str | None = Query(None),
    brand_id: int | None = Query(None),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return ProductsService(db).list_products(
        status=ProductStatus.ACTIVE,
        search=search,
        brand_id=brand_id,
        category_id=category_id,
    )


@router.get("/archived", response_model=ProductListResponse)
def list_archived_products(
    search: str | None = Query(None),
    brand_id: int | None = Query(None),
    category_id: int | None = Query(None),
    db: Session = Depends(get_db),
):
    return ProductsService(db).list_archived_products(
        search=search,
        brand_id=brand_id,
        category_id=category_id,
    )


@router.post("", response_model=ProductRead)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    return ProductsService(db).create_product(payload)


@router.put("/{product_id}", response_model=ProductRead)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    return ProductsService(db).update_product(product_id, payload)


@router.post("/{product_id}/archive", response_model=ProductRead)
def archive_product(product_id: int, db: Session = Depends(get_db)):
    return ProductsService(db).archive_product(product_id)


@router.post("/{product_id}/restore", response_model=ProductRead)
def restore_product(product_id: int, db: Session = Depends(get_db)):
    return ProductsService(db).restore_product(product_id)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def permanently_delete_product(product_id: int, db: Session = Depends(get_db)):
    ProductsService(db).permanently_delete_product(product_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/brands", response_model=list[BrandRead])
def list_brands(db: Session = Depends(get_db)):
    return ProductsService(db).list_brands()


@router.post("/brands", response_model=BrandRead)
def create_brand(payload: BrandCreate, db: Session = Depends(get_db)):
    return ProductsService(db).create_brand(payload)


@router.get("/categories", response_model=list[CategoryRead])
def list_categories(db: Session = Depends(get_db)):
    return ProductsService(db).list_categories()


@router.post("/categories", response_model=CategoryRead)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db)):
    return ProductsService(db).create_category(payload)


@router.post("/upload-image", response_model=ProductImageUploadResponse)
async def upload_product_image(image: UploadFile = File(...), db: Session = Depends(get_db)):
    image_url = await ProductsService(db).upload_product_image(image)
    return ProductImageUploadResponse(image_url=image_url)
