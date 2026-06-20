from __future__ import annotations

import math
from datetime import datetime, timedelta
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import Select, case, func, literal, or_, select
from sqlalchemy.orm import Session, selectinload

from app.core.media import to_public_image_url
from app.models.products import Brand, Category, InventoryRecord, Product, ProductPackagingConversion, ProductStatus, StockMovement
from app.schemas.inventory import (
    InventoryAnalyticsResponse,
    InventoryDetailResponse,
    InventoryIntelligenceSignal,
    InventoryItemRead,
    InventoryKpiData,
    InventoryListResponse,
    InventoryMovementPageResponse,
    InventoryMovementSummary,
    InventorySettingsUpdate,
    InventoryStockOperation,
    InventoryStockOperationResponse,
    InventoryUnitInfo,
    StockHealthRead,
    StockMovementRead,
)
from app.utils.inventory_conversion import convert_inventory


def _health_percentage(quantity: int, max_capacity: int) -> float | None:
    if max_capacity <= 0:
        return None
    return round((quantity / max_capacity) * 100, 1)


def _health_status(quantity: int, max_capacity: int) -> str:
    if quantity <= 0:
        return "out_of_stock"
    percentage = _health_percentage(quantity, max_capacity)
    if percentage is None:
        return "not_configured"
    if percentage <= 15:
        return "critical"
    if percentage <= 35:
        return "low_stock"
    if percentage <= 80:
        return "healthy"
    return "overstocked"


def _page_count(total: int, page_size: int) -> int:
    return math.ceil(total / page_size) if total else 0


class InventoryService:
    def __init__(self, db: Session):
        self.db = db

    def list_inventory(
        self,
        *,
        search: str | None = None,
        category_id: int | None = None,
        status_filter: str | None = None,
        page: int = 1,
        page_size: int = 24,
    ) -> InventoryListResponse:
        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        status_expr = self._status_sql_expression()
        health_pct_expr = self._health_percentage_sql_expression()
        inventory_value_expr = Product.cost_price * InventoryRecord.quantity_base_unit

        query: Select = (
            select(
                Product.id.label("product_id"),
                Product.id.label("id"),
                Product.sku,
                Product.barcode,
                Product.name,
                Product.description,
                Product.supplier_name,
                Product.image_url,
                Product.base_unit,
                Product.main_unit_name,
                Product.base_unit_name,
                Product.conversion_factor,
                Product.stock_location,
                InventoryRecord.quantity_base_unit,
                Product.max_capacity,
                Product.reorder_level,
                Product.standard_pack_size,
                Product.cost_price.label("unit_cost"),
                Product.selling_price,
                inventory_value_expr.label("inventory_value"),
                Product.total_units_sold,
                Product.total_income_generated,
                Product.last_movement_date,
                Product.created_at,
                Product.updated_at,
                Brand.name.label("brand_name"),
                Category.name.label("category_name"),
                status_expr.label("status"),
                health_pct_expr.label("stock_health_percentage"),
            )
            .join(Brand, Product.brand_id == Brand.id)
            .join(InventoryRecord, InventoryRecord.product_id == Product.id)
            .outerjoin(Category, Product.category_id == Category.id)
            .where(Product.status == ProductStatus.ACTIVE)
        )

        count_query: Select = (
            select(func.count(Product.id))
            .join(Brand, Product.brand_id == Brand.id)
            .join(InventoryRecord, InventoryRecord.product_id == Product.id)
            .outerjoin(Category, Product.category_id == Category.id)
            .where(Product.status == ProductStatus.ACTIVE)
        )

        if search:
            needle = f"%{search.strip()}%"
            search_clause = or_(
                Product.name.ilike(needle),
                Brand.name.ilike(needle),
                Product.sku.ilike(needle),
                Product.barcode.ilike(needle),
                Product.supplier_name.ilike(needle),
            )
            query = query.where(search_clause)
            count_query = count_query.where(search_clause)

        if category_id is not None:
            query = query.where(Product.category_id == category_id)
            count_query = count_query.where(Product.category_id == category_id)

        if status_filter:
            query = query.where(status_expr == status_filter)
            count_query = count_query.where(status_expr == status_filter)

        total = int(self.db.execute(count_query).scalar_one() or 0)
        rows = self.db.execute(
            query.order_by(Product.updated_at.desc(), Product.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).all()

        items = [self._row_to_inventory_item(row._mapping) for row in rows]
        return InventoryListResponse(
            items=items,
            total=total,
            page=page,
            page_size=page_size,
            total_pages=_page_count(total, page_size),
            kpi=self._compute_kpi(),
        )

    def get_detail(self, product_id: int) -> InventoryDetailResponse | None:
        product = self._get_product(product_id, include_units=True)
        if not product:
            return None

        return InventoryDetailResponse(
            item=self._to_inventory_item(product, include_units=True),
            stock_health=self._to_stock_health(product),
        )

    def update_settings(self, product_id: int, payload: InventorySettingsUpdate) -> InventoryItemRead:
        product = self._get_product(product_id, include_units=False)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

        if payload.max_capacity is not None:
            product.max_capacity = payload.max_capacity
        if payload.reorder_level is not None:
            product.reorder_level = payload.reorder_level
        if payload.standard_pack_size is not None:
            product.standard_pack_size = payload.standard_pack_size
        if payload.stock_location is not None:
            product.stock_location = payload.stock_location.strip() or None

        product.updated_at = datetime.utcnow()
        self.db.commit()
        detail = self.get_detail(product_id)
        if not detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")
        return detail.item

    def apply_stock_operation(
        self,
        product_id: int,
        payload: InventoryStockOperation,
    ) -> InventoryStockOperationResponse:
        product = self._get_product(product_id, include_units=False)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

        inventory = self._ensure_inventory_record(product)
        current_quantity = inventory.quantity_base_unit
        if payload.operation == "add":
            delta = payload.quantity
            movement_type = "OPENING_STOCK" if current_quantity == 0 and not self._has_movements(product.id) else "STOCK_IN"
        elif payload.operation == "remove":
            delta = -payload.quantity
            movement_type = "STOCK_OUT"
        else:
            delta = payload.quantity - current_quantity
            movement_type = "ADJUSTMENT"

        new_quantity = current_quantity + delta
        if new_quantity < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity cannot go below zero")

        now = datetime.utcnow()
        inventory.quantity_base_unit = new_quantity
        inventory.updated_at = now
        product.stock_quantity = new_quantity
        product.last_movement_date = now
        product.updated_at = now

        if movement_type == "STOCK_OUT" and delta < 0:
            sold_units = abs(delta)
            product.total_units_sold = (product.total_units_sold or 0) + sold_units
            product.total_income_generated = Decimal(str(product.total_income_generated or 0)) + (
                Decimal(str(product.selling_price)) * Decimal(sold_units)
            )

        movement = StockMovement(
            product_id=product.id,
            quantity=abs(delta) if payload.operation != "adjust" else abs(payload.quantity - current_quantity),
            previous_quantity=current_quantity,
            new_quantity=new_quantity,
            movement_type=movement_type,
            type=movement_type,
            reference=payload.reference.strip() if payload.reference else None,
            notes=payload.notes.strip() if payload.notes else None,
            created_at=now,
        )
        self.db.add(movement)
        self.db.commit()
        self.db.refresh(movement)

        detail = self.get_detail(product_id)
        if not detail:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

        return InventoryStockOperationResponse(
            item=detail.item,
            movement=StockMovementRead.model_validate(movement),
        )

    def list_movements(
        self,
        product_id: int,
        *,
        page: int = 1,
        page_size: int = 20,
    ) -> InventoryMovementPageResponse:
        if not self._product_exists(product_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

        page = max(page, 1)
        page_size = min(max(page_size, 1), 100)
        total = int(
            self.db.execute(
                select(func.count(StockMovement.id)).where(StockMovement.product_id == product_id)
            ).scalar_one()
            or 0
        )
        movements = self.db.execute(
            select(StockMovement)
            .where(StockMovement.product_id == product_id)
            .order_by(StockMovement.created_at.desc(), StockMovement.id.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        ).scalars().all()

        return InventoryMovementPageResponse(
            items=[StockMovementRead.model_validate(item) for item in movements],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=_page_count(total, page_size),
        )

    def get_analytics(self, product_id: int) -> InventoryAnalyticsResponse:
        product = self._get_product(product_id, include_units=False)
        if not product:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inventory item not found")

        summary = self._movement_summary(product)
        stock_health = self._to_stock_health(product)
        return InventoryAnalyticsResponse(
            stock_health=stock_health,
            movement_summary=summary,
            intelligence=self._build_intelligence(product, summary, stock_health),
        )

    def _compute_kpi(self) -> InventoryKpiData:
        status_expr = self._status_sql_expression()
        total_value_expr = Product.cost_price * InventoryRecord.quantity_base_unit
        aggregate = self.db.execute(
            select(
                func.count(Product.id).label("total_items"),
                func.coalesce(func.sum(total_value_expr), 0).label("total_value"),
                func.coalesce(func.sum(case((status_expr == "low_stock", 1), else_=0)), 0).label("low_stock"),
                func.coalesce(func.sum(case((status_expr == "critical", 1), else_=0)), 0).label("critical"),
                func.coalesce(func.sum(case((status_expr == "out_of_stock", 1), else_=0)), 0).label("out_of_stock"),
                func.coalesce(func.sum(case((status_expr == "overstocked", 1), else_=0)), 0).label("overstocked"),
            )
            .join(InventoryRecord, InventoryRecord.product_id == Product.id)
            .where(Product.status == ProductStatus.ACTIVE)
        ).one()

        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        sold_30 = (
            select(
                StockMovement.product_id.label("product_id"),
                func.sum(StockMovement.quantity).label("sold_units"),
            )
            .where(
                StockMovement.movement_type == "STOCK_OUT",
                StockMovement.created_at >= thirty_days_ago,
            )
            .group_by(StockMovement.product_id)
            .subquery()
        )
        threshold_expr = case(
            (Product.reorder_level > Product.standard_pack_size, Product.reorder_level),
            else_=Product.standard_pack_size,
        )
        fast_moving_count = int(
            self.db.execute(
                select(func.count(Product.id))
                .join(sold_30, sold_30.c.product_id == Product.id)
                .where(
                    Product.status == ProductStatus.ACTIVE,
                    sold_30.c.sold_units >= threshold_expr,
                )
            ).scalar_one()
            or 0
        )

        sold_ever = (
                select(StockMovement.product_id.label("product_id"))
            .where(StockMovement.movement_type == "STOCK_OUT")
            .group_by(StockMovement.product_id)
            .subquery()
        )
        dead_stock_count = int(
            self.db.execute(
                select(func.count(Product.id))
                .outerjoin(sold_ever, sold_ever.c.product_id == Product.id)
                .where(
                    Product.status == ProductStatus.ACTIVE,
                    InventoryRecord.quantity_base_unit > 0,
                    sold_ever.c.product_id.is_(None),
                )
                .join(InventoryRecord, InventoryRecord.product_id == Product.id)
            ).scalar_one()
            or 0
        )

        return InventoryKpiData(
            total_items=int(aggregate.total_items or 0),
            total_value=float(aggregate.total_value or 0),
            low_stock_count=int(aggregate.low_stock or 0),
            critical_count=int(aggregate.critical or 0),
            out_of_stock_count=int(aggregate.out_of_stock or 0),
            overstocked_count=int(aggregate.overstocked or 0),
            fast_moving_count=fast_moving_count,
            dead_stock_count=dead_stock_count,
        )

    def _movement_summary(self, product: Product) -> InventoryMovementSummary:
        received_expr = case(
            (StockMovement.movement_type.in_(("STOCK_IN", "OPENING_STOCK")), StockMovement.quantity),
            else_=0,
        )
        sold_expr = case((StockMovement.movement_type == "STOCK_OUT", StockMovement.quantity), else_=0)
        net_expr = case(
            (StockMovement.movement_type.in_(("STOCK_IN", "OPENING_STOCK")), StockMovement.quantity),
            (StockMovement.movement_type == "STOCK_OUT", -StockMovement.quantity),
            else_=StockMovement.new_quantity - StockMovement.previous_quantity,
        )
        aggregate = self.db.execute(
            select(
                func.count(StockMovement.id).label("movement_count"),
                func.coalesce(func.sum(received_expr), 0).label("received"),
                func.coalesce(func.sum(sold_expr), 0).label("sold"),
                func.coalesce(func.sum(net_expr), 0).label("net_change"),
                func.max(StockMovement.created_at).label("last_movement_date"),
            ).where(StockMovement.product_id == product.id)
        ).one()

        now = datetime.utcnow()
        sold_28 = self._sold_units_since(product.id, now - timedelta(days=28))
        sold_90 = self._sold_units_since(product.id, now - timedelta(days=90))
        quantity = self._quantity_base_unit(product)

        average_weekly = round(sold_28 / 4, 2) if sold_28 > 0 else None
        turnover_rate = round(sold_90 / max(quantity, 1), 2) if sold_90 > 0 else None
        estimated_duration = None
        if average_weekly and average_weekly > 0:
            estimated_duration = round(quantity / (average_weekly / 7), 1)

        sold_units = int(aggregate.sold or 0)
        revenue = Decimal(str(product.selling_price)) * Decimal(sold_units)
        return InventoryMovementSummary(
            movement_count=int(aggregate.movement_count or 0),
            total_units_received=int(aggregate.received or 0),
            total_units_sold=sold_units,
            net_quantity_change=int(aggregate.net_change or 0),
            average_weekly_units_sold=average_weekly,
            inventory_turnover_rate=turnover_rate,
            estimated_stock_duration_days=estimated_duration,
            revenue_from_stock_reductions=float(revenue),
            last_movement_date=aggregate.last_movement_date,
            has_enough_activity=bool((aggregate.movement_count or 0) >= 2 and sold_units > 0),
        )

    def _sold_units_since(self, product_id: int, since: datetime) -> int:
        return int(
            self.db.execute(
                select(func.coalesce(func.sum(StockMovement.quantity), 0)).where(
                    StockMovement.product_id == product_id,
                    StockMovement.movement_type == "STOCK_OUT",
                    StockMovement.created_at >= since,
                )
            ).scalar_one()
            or 0
        )

    def _build_intelligence(
        self,
        product: Product,
        summary: InventoryMovementSummary,
        stock_health: StockHealthRead,
    ) -> list[InventoryIntelligenceSignal]:
        signals: list[InventoryIntelligenceSignal] = []
        quantity = self._quantity_base_unit(product)

        if product.reorder_level > 0 and quantity <= product.reorder_level:
            signals.append(
                InventoryIntelligenceSignal(
                    category="low_stock_risk",
                    title="Low Stock Risk",
                    reason=(
                        f"Current quantity is {quantity:,}, at or below the "
                        f"configured reorder level of {product.reorder_level:,}."
                    ),
                    severity="critical" if quantity <= max(product.reorder_level * 0.3, 1) else "warning",
                )
            )

        if not summary.has_enough_activity:
            return signals

        average_weekly = summary.average_weekly_units_sold or 0
        pack_size = product.standard_pack_size or 0
        if pack_size > 1:
            fast_threshold = pack_size * 2
            fast_reason = "above two standard packs"
            slow_threshold = max(pack_size * 0.25, 1)
        else:
            fast_threshold = max((product.reorder_level or 0) * 0.05, 10)
            fast_reason = "above the reorder-level movement threshold"
            slow_threshold = 1

        if average_weekly >= fast_threshold:
            signals.append(
                InventoryIntelligenceSignal(
                    category="fast_moving",
                    title="Fast Moving Item",
                    reason=f"Average stock reduction is {average_weekly:,.1f} units weekly, {fast_reason}.",
                    severity="positive",
                )
            )
        elif average_weekly > 0 and average_weekly < slow_threshold:
            signals.append(
                InventoryIntelligenceSignal(
                    category="slow_moving",
                    title="Slow Moving Item",
                    reason=f"Average stock reduction is only {average_weekly:,.1f} units weekly.",
                    severity="info",
                )
            )

        if summary.total_units_sold == 0 and summary.movement_count >= 2:
            signals.append(
                InventoryIntelligenceSignal(
                    category="dead_stock",
                    title="Dead Stock",
                    reason="Movement history exists, but no stock reductions have been recorded for this item.",
                    severity="warning",
                )
            )

        inventory_value = Decimal(str(product.cost_price)) * Decimal(quantity)
        revenue = Decimal(str(summary.revenue_from_stock_reductions))
        if revenue > 0 and revenue >= inventory_value:
            signals.append(
                InventoryIntelligenceSignal(
                    category="high_value_item",
                    title="High Value Item",
                    reason=(
                        f"Recorded stock reductions represent LKR {float(revenue):,.2f}, "
                        "which is at least the current inventory value."
                    ),
                    severity="positive",
                )
            )

        if summary.estimated_stock_duration_days is not None and summary.estimated_stock_duration_days <= 14:
            signals.append(
                InventoryIntelligenceSignal(
                    category="restock_recommended",
                    title="Restock Recommended",
                    reason=(
                        f"At the current movement trend, stock is estimated to last "
                        f"{summary.estimated_stock_duration_days:,.1f} days."
                    ),
                    severity="warning",
                )
            )
        elif average_weekly > 0 and quantity <= product.reorder_level + average_weekly:
            signals.append(
                InventoryIntelligenceSignal(
                    category="restock_recommended",
                    title="Restock Recommended",
                    reason=(
                        f"Current quantity is within one average sales week "
                        f"({average_weekly:,.1f} units) of the reorder level."
                    ),
                    severity="warning",
                )
            )

        if not signals and stock_health.status == "healthy":
            signals.append(
                InventoryIntelligenceSignal(
                    category="slow_moving",
                    title="Stable Movement",
                    reason="Movement and stock levels are within configured operating ranges.",
                    severity="info",
                )
            )

        return signals

    def _status_sql_expression(self):
        percentage = self._health_percentage_sql_expression()
        return case(
            (InventoryRecord.quantity_base_unit <= 0, literal("out_of_stock")),
            (Product.max_capacity <= 0, literal("not_configured")),
            (percentage <= 15, literal("critical")),
            (percentage <= 35, literal("low_stock")),
            (percentage <= 80, literal("healthy")),
            else_=literal("overstocked"),
        )

    def _health_percentage_sql_expression(self):
        return (InventoryRecord.quantity_base_unit * 100.0) / func.nullif(Product.max_capacity, 0)

    def _to_stock_health(self, product: Product) -> StockHealthRead:
        quantity = self._quantity_base_unit(product)
        return StockHealthRead(
            percentage=_health_percentage(quantity, product.max_capacity or 0),
            status=_health_status(quantity, product.max_capacity or 0),
            current_quantity=quantity,
            max_capacity=product.max_capacity or 0,
            reorder_level=product.reorder_level or 0,
        )

    def _row_to_inventory_item(self, row) -> InventoryItemRead:
        inventory_value = Decimal(str(row.inventory_value or 0)).quantize(Decimal("0.01"))
        stock_health_percentage = None
        if row.stock_health_percentage is not None:
            stock_health_percentage = round(float(row.stock_health_percentage), 1)
        quantity = int(row.quantity_base_unit or 0)
        converted = convert_inventory(
            quantity=quantity,
            conversion_factor=row.conversion_factor,
            main_unit_name=row.main_unit_name,
            base_unit_name=row.base_unit_name,
        )

        return InventoryItemRead(
            id=row.id,
            product_id=row.product_id,
            sku=row.sku,
            barcode=row.barcode,
            name=row.name,
            description=row.description,
            brand_name=row.brand_name,
            category_name=row.category_name,
            supplier_name=row.supplier_name,
            image_url=to_public_image_url(row.image_url),
            main_unit_name=row.main_unit_name,
            base_unit_name=row.base_unit_name,
            conversion_factor=row.conversion_factor,
            stock_location=row.stock_location,
            base_unit=row.base_unit_name,
            quantity_base_unit=quantity,
            stock_quantity=quantity,
            main_units=converted.main_units,
            remaining_base_units=converted.remaining_base_units,
            quantity_display=converted.display,
            max_capacity=row.max_capacity or 0,
            reorder_level=row.reorder_level or 0,
            standard_pack_size=row.standard_pack_size or 1,
            unit_cost=row.unit_cost,
            selling_price=row.selling_price,
            inventory_value=inventory_value,
            status=row.status,
            stock_health_percentage=stock_health_percentage,
            stock_health_status=row.status,
            total_units_sold=row.total_units_sold or 0,
            total_income_generated=Decimal(str(row.total_income_generated or 0)).quantize(Decimal("0.01")),
            last_movement_date=row.last_movement_date,
            units=[],
            created_at=row.created_at,
            updated_at=row.updated_at,
        )

    def _to_inventory_item(self, product: Product, *, include_units: bool) -> InventoryItemRead:
        unit_info: list[InventoryUnitInfo] = []
        if include_units:
            for unit in sorted(product.units or [], key=lambda item: item.level):
                info = InventoryUnitInfo(
                    unit_name=unit.name,
                    is_base=unit.is_base,
                    level=unit.level,
                    conversion_quantity=None,
                    parent_unit_name=None,
                )
                if not unit.is_base:
                    for conversion in product.conversions or []:
                        if conversion.parent_unit_id == unit.id:
                            info.conversion_quantity = conversion.quantity
                            info.parent_unit_name = conversion.child_unit.name
                            break
                unit_info.append(info)

        quantity = self._quantity_base_unit(product)
        converted = convert_inventory(
            quantity=quantity,
            conversion_factor=product.conversion_factor,
            main_unit_name=product.main_unit_name,
            base_unit_name=product.base_unit_name,
        )
        inventory_value = Decimal(str(product.cost_price)) * Decimal(quantity)
        stock_health = self._to_stock_health(product)
        return InventoryItemRead(
            id=product.id,
            product_id=product.id,
            sku=product.sku,
            barcode=product.barcode,
            name=product.name,
            description=product.description,
            brand_name=product.brand.name,
            category_name=product.category.name if product.category else None,
            supplier_name=product.supplier_name,
            image_url=to_public_image_url(product.image_url),
            main_unit_name=product.main_unit_name,
            base_unit_name=product.base_unit_name,
            conversion_factor=product.conversion_factor,
            stock_location=product.stock_location,
            base_unit=product.base_unit_name,
            quantity_base_unit=quantity,
            stock_quantity=quantity,
            main_units=converted.main_units,
            remaining_base_units=converted.remaining_base_units,
            quantity_display=converted.display,
            max_capacity=product.max_capacity or 0,
            reorder_level=product.reorder_level or 0,
            standard_pack_size=product.standard_pack_size or 1,
            unit_cost=product.cost_price,
            selling_price=product.selling_price,
            inventory_value=inventory_value.quantize(Decimal("0.01")),
            status=stock_health.status,
            stock_health_percentage=stock_health.percentage,
            stock_health_status=stock_health.status,
            total_units_sold=product.total_units_sold or 0,
            total_income_generated=Decimal(str(product.total_income_generated or 0)).quantize(Decimal("0.01")),
            last_movement_date=product.last_movement_date,
            units=unit_info,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    def _get_product(self, product_id: int, *, include_units: bool) -> Product | None:
        options = [
            selectinload(Product.brand),
            selectinload(Product.category),
            selectinload(Product.inventory_record),
        ]
        if include_units:
            options.extend(
                [
                    selectinload(Product.units),
                    selectinload(Product.conversions).selectinload(ProductPackagingConversion.parent_unit),
                    selectinload(Product.conversions).selectinload(ProductPackagingConversion.child_unit),
                ]
            )
        return self.db.execute(
            select(Product)
            .where(Product.id == product_id, Product.status == ProductStatus.ACTIVE)
            .options(*options)
        ).scalars().first()

    def _ensure_inventory_record(self, product: Product) -> InventoryRecord:
        if product.inventory_record is not None:
            return product.inventory_record
        inventory = InventoryRecord(product_id=product.id, quantity_base_unit=max(product.stock_quantity or 0, 0))
        self.db.add(inventory)
        self.db.flush()
        product.inventory_record = inventory
        return inventory

    def _quantity_base_unit(self, product: Product) -> int:
        return self._ensure_inventory_record(product).quantity_base_unit

    def _product_exists(self, product_id: int) -> bool:
        return bool(
            self.db.execute(
                select(Product.id).where(Product.id == product_id, Product.status == ProductStatus.ACTIVE).limit(1)
            ).scalar_one_or_none()
        )

    def _has_movements(self, product_id: int) -> bool:
        return bool(
            self.db.execute(
                select(StockMovement.id).where(StockMovement.product_id == product_id).limit(1)
            ).scalar_one_or_none()
        )
