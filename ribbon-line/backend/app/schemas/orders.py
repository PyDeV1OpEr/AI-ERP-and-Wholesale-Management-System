from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, ConfigDict, Field, model_validator


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class OrderSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        from_attributes=True,
        populate_by_name=True,
    )


class OrderItemCreate(OrderSchema):
    product_id: int = Field(gt=0)
    unit: str = Field(min_length=1, max_length=80)
    requested_quantity: int = Field(gt=0)


class OrderItemUpdate(OrderSchema):
    delivered_quantity: int | None = Field(None, ge=0)
    status: str | None = Field(None, pattern="^(PENDING|RESERVED|DELIVERED|OUT_OF_STOCK)$")
    unit: str | None = Field(None, min_length=1, max_length=80)
    requested_quantity: int | None = Field(None, gt=0)


class OrderItemRead(OrderSchema):
    id: int
    order_id: int
    product_id: int
    product_name: str
    product_code: str | None
    unit: str
    requested_quantity: int
    delivered_quantity: int
    remaining_quantity: int
    reserved_quantity_base: int
    unit_price: Decimal
    total_price: Decimal
    status: str
    created_at: datetime
    updated_at: datetime


class OrderCreate(OrderSchema):
    customer_id: int = Field(gt=0)
    items: list[OrderItemCreate] = Field(min_length=1)
    notes: str | None = None
    created_by: str | None = None

    @model_validator(mode="after")
    def validate_items(self):
        seen: set[tuple[int, str]] = set()
        for item in self.items:
            key = (item.product_id, item.unit.strip().lower())
            if key in seen:
                raise ValueError("Duplicate products with the same unit are not allowed in one order.")
            seen.add(key)
            item.unit = item.unit.strip()
        return self


class OrderUpdate(OrderSchema):
    status: str | None = Field(None, pattern="^(PENDING|RESERVED|DELIVERED|COMPLETED)$")
    notes: str | None = None


class OrderRead(OrderSchema):
    id: int
    order_number: str
    customer_id: int
    customer_name: str | None = None
    status: str
    total_amount: Decimal
    notes: str | None
    created_by: str | None
    completed_at: datetime | None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemRead]


class OrderListResponse(OrderSchema):
    items: list[OrderRead]
    total: int
    offset: int
    limit: int


class DeliveredQuantityUpdate(OrderSchema):
    delivered_quantity: int = Field(ge=0)
