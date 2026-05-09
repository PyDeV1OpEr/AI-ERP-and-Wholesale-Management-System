"""Pydantic response schemas for dashboard APIs."""

from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel, Field


class DashboardStat(BaseModel):
    id: str
    title: str
    value: str
    trend_percent: float = Field(..., description="Percent movement from prior period")
    trend_direction: str
    subtitle: str


class DashboardOrder(BaseModel):
    id: str
    customer_name: str
    sku: str
    quantity: int
    total_amount: float
    status: str
    ordered_at: datetime


class DashboardActivity(BaseModel):
    id: str
    title: str
    description: str
    level: str
    happened_at: datetime


class DashboardInsight(BaseModel):
    id: str
    headline: str
    detail: str
    confidence: float
    impact: str


class DashboardStockItem(BaseModel):
    id: str
    item_name: str
    sku: str
    available_units: int
    reorder_level: int

