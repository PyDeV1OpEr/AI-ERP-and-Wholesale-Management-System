from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, model_validator


class BrandCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class BrandRead(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)


class CategoryRead(BaseModel):
    id: int
    name: str

    model_config = {"from_attributes": True}


class ProductPackagingLevelInput(BaseModel):
    unit_name: str = Field(min_length=1, max_length=80)
    contains: int = Field(gt=0, description="How many of child unit this parent unit contains")


class ProductCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    brand_id: int = Field(gt=0, description="Brand is required")
    category_id: int | None = None
    base_unit: str = Field(default="Unit", min_length=1, max_length=80)
    main_unit_name: str = Field(default="Box", min_length=1, max_length=80)
    base_unit_name: str = Field(default="Unit", min_length=1, max_length=80)
    conversion_factor: int = Field(default=1, gt=0)
    selling_price: Decimal = Field(ge=0, description="Default selling price in LKR")
    cost_price: Decimal = Field(ge=0, description="Buying price in LKR")
    image_url: str | None = None
    is_active: bool = True
    packaging_levels: list[ProductPackagingLevelInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_pricing(self):
        if self.cost_price < 0:
            raise ValueError("Buying price cannot be negative.")
        if self.selling_price < 0:
            raise ValueError("Selling price cannot be negative.")
        self.main_unit_name = self.main_unit_name.strip()
        self.base_unit_name = self.base_unit_name.strip() or self.base_unit.strip()
        self.base_unit = self.base_unit_name
        return self


class ProductUpdate(ProductCreate):
    pass


class ProductUnitRead(BaseModel):
    id: int
    name: str
    is_base: bool
    level: int

    model_config = {"from_attributes": True}


class ProductPackagingConversionRead(BaseModel):
    id: int
    parent_unit_id: int
    child_unit_id: int
    parent_unit_name: str
    child_unit_name: str
    quantity: int


class ProductRead(BaseModel):
    id: int
    name: str
    brand_id: int
    brand_name: str
    category_id: int | None
    category_name: str | None
    base_unit: str
    main_unit_name: str
    base_unit_name: str
    conversion_factor: int
    selling_price: Decimal
    cost_price: Decimal
    image_url: str | None
    is_active: bool
    status: str
    is_archived: bool
    archived_at: datetime | None = None
    packaging_summary: str
    units: list[ProductUnitRead]
    conversions: list[ProductPackagingConversionRead]
    created_at: datetime
    updated_at: datetime


class ProductListResponse(BaseModel):
    items: list[ProductRead]
    total: int


class ProductImageUploadResponse(BaseModel):
    image_url: str
