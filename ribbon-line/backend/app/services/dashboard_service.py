"""Service layer for dashboard data retrieval."""

from __future__ import annotations

from datetime import datetime, timedelta
from app.schemas.dashboard import (
    DashboardActivity,
    DashboardInsight,
    DashboardOrder,
    DashboardStat,
    DashboardStockItem,
)


class DashboardService:
    """
    Dashboard service currently serves deterministic demo data.

    This class can later be migrated to query repositories/ORM models without
    changing the API contract exposed to the frontend.
    """

    @staticmethod
    def get_stats() -> list[DashboardStat]:
        return [
            DashboardStat(
                id="revenue",
                title="Monthly Revenue",
                value="$182,400",
                trend_percent=8.4,
                trend_direction="up",
                subtitle="vs previous month",
            ),
            DashboardStat(
                id="orders",
                title="Open Wholesale Orders",
                value="126",
                trend_percent=3.1,
                trend_direction="up",
                subtitle="active this week",
            ),
            DashboardStat(
                id="stock_health",
                title="Stock Health Index",
                value="94%",
                trend_percent=1.8,
                trend_direction="up",
                subtitle="low-risk inventory posture",
            ),
            DashboardStat(
                id="at_risk_payments",
                title="At-Risk Payments",
                value="7",
                trend_percent=2.6,
                trend_direction="down",
                subtitle="fewer than last cycle",
            ),
        ]

    @staticmethod
    def get_orders() -> list[DashboardOrder]:
        now = datetime.utcnow()
        return [
            DashboardOrder(
                id="ORD-3021",
                customer_name="Nexa Retail Group",
                sku="RB-XL-445",
                quantity=320,
                total_amount=18640.0,
                status="Processing",
                ordered_at=now - timedelta(hours=3),
            ),
            DashboardOrder(
                id="ORD-3018",
                customer_name="Aster Distributors",
                sku="RB-MD-212",
                quantity=180,
                total_amount=9730.0,
                status="Packed",
                ordered_at=now - timedelta(hours=8),
            ),
            DashboardOrder(
                id="ORD-3009",
                customer_name="Urban Trade Lines",
                sku="RB-ST-109",
                quantity=450,
                total_amount=25420.0,
                status="Shipped",
                ordered_at=now - timedelta(days=1, hours=2),
            ),
        ]

    @staticmethod
    def get_activities() -> list[DashboardActivity]:
        now = datetime.utcnow()
        return [
            DashboardActivity(
                id="ACT-1",
                title="Container #IN-77 Cleared",
                description="Inbound shipment released at local port and routed to warehouse B.",
                level="success",
                happened_at=now - timedelta(minutes=35),
            ),
            DashboardActivity(
                id="ACT-2",
                title="Stock Reorder Triggered",
                description="6 SKUs crossed reorder threshold and procurement draft was created.",
                level="warning",
                happened_at=now - timedelta(hours=2),
            ),
            DashboardActivity(
                id="ACT-3",
                title="Invoice Batch Generated",
                description="Automated invoice run completed for 22 wholesale accounts.",
                level="info",
                happened_at=now - timedelta(hours=4),
            ),
        ]

    @staticmethod
    def get_insights() -> list[DashboardInsight]:
        return [
            DashboardInsight(
                id="INS-1",
                headline="Demand Spike on RB-XL-445",
                detail="Forecast model estimates a 17% demand increase over next 10 days.",
                confidence=0.91,
                impact="high",
            ),
            DashboardInsight(
                id="INS-2",
                headline="Payment Delay Risk Reduced",
                detail="Improved collection pattern detected among top-20 accounts this cycle.",
                confidence=0.86,
                impact="medium",
            ),
        ]

    @staticmethod
    def get_stock_overview() -> list[DashboardStockItem]:
        return [
            DashboardStockItem(
                id="STK-1",
                item_name="Ribbon Line Premium Roll",
                sku="RB-XL-445",
                available_units=1240,
                reorder_level=600,
            ),
            DashboardStockItem(
                id="STK-2",
                item_name="Ribbon Line Standard Pack",
                sku="RB-ST-109",
                available_units=510,
                reorder_level=500,
            ),
            DashboardStockItem(
                id="STK-3",
                item_name="Ribbon Line Midweight Bundle",
                sku="RB-MD-212",
                available_units=780,
                reorder_level=400,
            ),
        ]
