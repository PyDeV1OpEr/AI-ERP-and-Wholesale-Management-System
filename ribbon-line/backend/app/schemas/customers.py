from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr


class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    email: EmailStr | None = None
    phone_number: str = Field(min_length=1, max_length=50)
    address: str | None = None
    status: str = Field(default="ACTIVE")


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=160)
    email: EmailStr | None = None
    phone_number: str | None = Field(None, min_length=1, max_length=50)
    address: str | None = None
    status: str | None = None


class CustomerRead(BaseModel):
    id: int
    full_name: str
    email: str | None
    phone_number: str
    address: str | None
    status: str
    total_orders_count: int
    total_spent: Decimal
    last_order_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerRead]
    total: int
    offset: int
    limit: int


class CustomerSummary(BaseModel):
    id: int
    full_name: str
    email: str | None
    phone_number: str
    status: str
    total_orders_count: int
    total_spent: Decimal
    last_order_date: datetime | None
