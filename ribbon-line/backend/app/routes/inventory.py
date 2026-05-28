from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.inventory import (
    InventoryAnalyticsResponse,
    InventoryDetailResponse,
    InventoryItemRead,
    InventoryListResponse,
    InventoryMovementPageResponse,
    InventorySettingsUpdate,
    InventoryStockOperation,
    InventoryStockOperationResponse,
)
from app.services.inventory_service import InventoryService

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.get("", response_model=InventoryListResponse)
def list_inventory(
    search: str | None = Query(None),
    category_id: int | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(24, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return InventoryService(db).list_inventory(
        search=search,
        category_id=category_id,
        status_filter=status,
        page=page,
        page_size=page_size,
    )


@router.get("/{product_id}", response_model=InventoryDetailResponse)
def get_inventory_detail(product_id: int, db: Session = Depends(get_db)):
    result = InventoryService(db).get_detail(product_id)
    if not result:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return result


@router.patch("/{product_id}/settings", response_model=InventoryItemRead)
def update_inventory_settings(
    product_id: int,
    payload: InventorySettingsUpdate,
    db: Session = Depends(get_db),
):
    return InventoryService(db).update_settings(product_id, payload)


@router.post("/{product_id}/stock-operations", response_model=InventoryStockOperationResponse)
def apply_stock_operation(
    product_id: int,
    payload: InventoryStockOperation,
    db: Session = Depends(get_db),
):
    return InventoryService(db).apply_stock_operation(product_id, payload)


@router.get("/{product_id}/analytics", response_model=InventoryAnalyticsResponse)
def get_inventory_analytics(product_id: int, db: Session = Depends(get_db)):
    return InventoryService(db).get_analytics(product_id)


@router.get("/{product_id}/movements", response_model=InventoryMovementPageResponse)
def list_inventory_movements(
    product_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return InventoryService(db).list_movements(product_id, page=page, page_size=page_size)
