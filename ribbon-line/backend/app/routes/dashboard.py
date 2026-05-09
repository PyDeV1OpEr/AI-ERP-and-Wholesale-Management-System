"""Dashboard API routes."""

from __future__ import annotations

from fastapi import APIRouter

from app.schemas.dashboard import (
    DashboardActivity,
    DashboardInsight,
    DashboardOrder,
    DashboardStat,
    DashboardStockItem,
)
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=list[DashboardStat])
def get_dashboard_stats():
    return DashboardService.get_stats()


@router.get("/orders", response_model=list[DashboardOrder])
def get_dashboard_orders():
    return DashboardService.get_orders()


@router.get("/activities", response_model=list[DashboardActivity])
def get_dashboard_activities():
    return DashboardService.get_activities()


@router.get("/insights", response_model=list[DashboardInsight])
def get_dashboard_insights():
    return DashboardService.get_insights()


@router.get("/stock", response_model=list[DashboardStockItem])
def get_dashboard_stock():
    return DashboardService.get_stock_overview()

