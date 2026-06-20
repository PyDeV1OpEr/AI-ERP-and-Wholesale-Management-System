from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, model_validator


InventoryStatus = Literal[
    "out_of_stock",
    "critical",
    "low_stock",
    "healthy",
    "overstocked",
    "not_configured",
]


class InventoryKpiData(BaseModel):
    total_items: int = 0
    total_value: float = Field(default=0, description="Total inventory value in LKR")
    low_stock_count: int = 0
    critical_count: int = 0
    out_of_stock_count: int = 0
    overstocked_count: int = 0
    fast_moving_count: int = 0
    dead_stock_count: int = 0


class InventoryUnitInfo(BaseModel):
    unit_name: str
    is_base: bool
    level: int
    conversion_quantity: int | None = None
    parent_unit_name: str | None = None


class StockMovementRead(BaseModel):
    id: int
    movement_type: str
    quantity: int
    previous_quantity: int
    new_quantity: int
    reference: str | None
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class StockHealthRead(BaseModel):
    percentage: float | None
    status: InventoryStatus
    current_quantity: int
    max_capacity: int
    reorder_level: int


class InventoryItemRead(BaseModel):
    id: int
    product_id: int
    sku: str | None = None
    barcode: str | None = None
    name: str
    description: str | None = None
    brand_name: str
    category_name: str | None
    supplier_name: str | None = None
    image_url: str | None
    main_unit_name: str
    base_unit_name: str
    conversion_factor: int
    stock_location: str | None = None
    base_unit: str
    quantity_base_unit: int
    stock_quantity: int
    main_units: int
    remaining_base_units: int
    quantity_display: str
    max_capacity: int
    reorder_level: int
    standard_pack_size: int
    unit_cost: Decimal
    selling_price: Decimal
    inventory_value: Decimal
    status: InventoryStatus
    stock_health_percentage: float | None
    stock_health_status: InventoryStatus
    inventory_turnover_rate: float | None = None
    estimated_stock_duration_days: float | None = None
    stock_intelligence_category: str | None = None
    total_units_sold: int = 0
    total_income_generated: Decimal = Decimal("0.00")
    last_movement_date: datetime | None = None
    units: list[InventoryUnitInfo] = Field(default_factory=list)
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = {"from_attributes": True}


class InventoryListResponse(BaseModel):
    items: list[InventoryItemRead]
    total: int
    page: int
    page_size: int
    total_pages: int
    kpi: InventoryKpiData


class InventoryDetailResponse(BaseModel):
    item: InventoryItemRead
    stock_health: StockHealthRead


class InventorySettingsUpdate(BaseModel):
    max_capacity: int | None = Field(default=None, ge=0)
    reorder_level: int | None = Field(default=None, ge=0)
    standard_pack_size: int | None = Field(default=None, ge=1)
    stock_location: str | None = Field(default=None, max_length=160)


class InventoryStockOperation(BaseModel):
    operation: Literal["add", "remove", "adjust"]
    quantity: int = Field(ge=0)
    reference: str | None = Field(default=None, max_length=160)
    notes: str | None = Field(default=None, max_length=500)

    @model_validator(mode="after")
    def validate_quantity(self):
        if self.operation in {"add", "remove"} and self.quantity <= 0:
            raise ValueError("Quantity must be greater than zero.")
        return self


class InventoryStockOperationResponse(BaseModel):
    item: InventoryItemRead
    movement: StockMovementRead


class InventoryMovementPageResponse(BaseModel):
    items: list[StockMovementRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class InventoryMovementSummary(BaseModel):
    movement_count: int
    total_units_received: int
    total_units_sold: int
    net_quantity_change: int
    average_weekly_units_sold: float | None
    inventory_turnover_rate: float | None
    estimated_stock_duration_days: float | None
    revenue_from_stock_reductions: float
    last_movement_date: datetime | None
    has_enough_activity: bool


class InventoryIntelligenceSignal(BaseModel):
    category: Literal[
        "fast_moving",
        "slow_moving",
        "dead_stock",
        "high_value_item",
        "low_stock_risk",
        "restock_recommended",
    ]
    title: str
    reason: str
    severity: Literal["info", "warning", "critical", "positive"]


class InventoryAnalyticsResponse(BaseModel):
    stock_health: StockHealthRead
    movement_summary: InventoryMovementSummary
    intelligence: list[InventoryIntelligenceSignal]
