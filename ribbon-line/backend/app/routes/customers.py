from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.customers import (
    CustomerCreate,
    CustomerListResponse,
    CustomerRead,
    CustomerSummary,
    CustomerUpdate,
)
from app.services.customers_service import CustomersService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    search: str | None = Query(None),
    status: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return CustomersService(db).list_customers(
        search=search,
        status=status,
        offset=offset,
        limit=limit,
    )


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_customer(customer_id)


@router.get("/{customer_id}/summary", response_model=CustomerSummary)
def get_customer_summary(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_customer_summary(customer_id)


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return CustomersService(db).create_customer(payload)


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    return CustomersService(db).update_customer(customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    CustomersService(db).delete_customer(customer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
