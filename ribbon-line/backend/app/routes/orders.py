from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from io import BytesIO

from app.database import get_db
from app.schemas.orders import (
    DeliveredQuantityUpdate,
    OrderCreate,
    OrderUpdate,
    OrderItemUpdate,
    OrderRead,
    OrderItemRead,
    OrderListResponse,
)
from app.services.orders_service import OrdersService

router = APIRouter(prefix="/orders", tags=["orders"])


@router.get("", response_model=OrderListResponse)
def list_orders(
    customer_id: int | None = Query(None),
    status: str | None = Query(None),
    search: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return OrdersService(db).list_orders(
        customer_id=customer_id,
        status=status,
        search=search,
        offset=offset,
        limit=limit,
    )


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    return OrdersService(db).create_order(payload)


@router.get("/{order_id}", response_model=OrderRead)
def get_order(order_id: int, db: Session = Depends(get_db)):
    return OrdersService(db).get_order(order_id)


@router.put("/{order_id}", response_model=OrderRead)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    return OrdersService(db).update_order(order_id, payload)


@router.put("/{order_id}/items/{item_id}", response_model=OrderItemRead)
def update_order_item(
    order_id: int,
    item_id: int,
    payload: OrderItemUpdate,
    db: Session = Depends(get_db),
):
    return OrdersService(db).update_order_item(order_id, item_id, payload)


@router.post("/{order_id}/items/{item_id}/deliver", response_model=OrderRead)
def deliver_order_item(
    order_id: int,
    item_id: int,
    payload: DeliveredQuantityUpdate,
    db: Session = Depends(get_db),
):
    return OrdersService(db).deliver_item(order_id, item_id, payload)


@router.post("/{order_id}/complete", response_model=OrderRead)
def complete_order(order_id: int, db: Session = Depends(get_db)):
    return OrdersService(db).complete_order(order_id)


@router.get("/{order_id}/export")
def export_order(order_id: int, db: Session = Depends(get_db)):
    content, filename = OrdersService(db).export_order_xlsx(order_id)
    return StreamingResponse(
        BytesIO(content),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    OrdersService(db).delete_order(order_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
