from __future__ import annotations

import logging

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customers import Customer, CustomerStatus
from app.repositories.customers_repository import CustomersRepository
from app.schemas.customers import (
    CustomerCreate,
    CustomerListResponse,
    CustomerRead,
    CustomerSummary,
    CustomerUpdate,
)

logger = logging.getLogger(__name__)


class CustomersService:
    def __init__(self, db: Session):
        self.repo = CustomersRepository(db)
        self.db = db

    def list_customers(
        self,
        *,
        search: str | None,
        status: str | None,
        offset: int = 0,
        limit: int = 50,
    ) -> CustomerListResponse:
        items, total = self.repo.list_customers(
            search=search,
            status=status,
            offset=offset,
            limit=limit,
        )
        return CustomerListResponse(
            items=[self._to_customer_read(item) for item in items],
            total=total,
            offset=offset,
            limit=limit,
        )

    def get_customer(self, customer_id: int) -> CustomerRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return self._to_customer_read(customer)

    def get_customer_summary(self, customer_id: int) -> CustomerSummary:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return CustomerSummary(
            id=customer.id,
            full_name=customer.full_name,
            email=customer.email,
            phone_number=customer.phone_number,
            status=customer.status,
            total_orders_count=customer.total_orders_count,
            total_spent=customer.total_spent,
            last_order_date=customer.last_order_date,
        )

    def create_customer(self, payload: CustomerCreate) -> CustomerRead:
        if payload.email:
            existing = self.repo.get_customer_by_email(payload.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer with this email already exists",
                )
        customer = Customer(
            full_name=payload.full_name.strip(),
            email=payload.email,
            phone_number=payload.phone_number.strip(),
            address=payload.address,
            status=payload.status,
        )
        self.repo.add_customer(customer)
        self.db.commit()
        return self._to_customer_read(customer)

    def update_customer(self, customer_id: int, payload: CustomerUpdate) -> CustomerRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        if payload.full_name is not None:
            customer.full_name = payload.full_name.strip()
        if payload.email is not None:
            if payload.email != customer.email:
                existing = self.repo.get_customer_by_email(payload.email)
                if existing:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Customer with this email already exists",
                    )
            customer.email = payload.email
        if payload.phone_number is not None:
            customer.phone_number = payload.phone_number.strip()
        if payload.address is not None:
            customer.address = payload.address
        if payload.status is not None:
            customer.status = payload.status
        self.db.commit()
        return self._to_customer_read(customer)

    def delete_customer(self, customer_id: int) -> None:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        self.repo.delete_customer(customer)
        self.db.commit()

    def _to_customer_read(self, customer: Customer) -> CustomerRead:
        return CustomerRead.model_validate(customer)
