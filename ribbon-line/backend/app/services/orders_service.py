from __future__ import annotations

import io
import json
import logging
import zipfile
from datetime import datetime
from decimal import Decimal
from html import escape

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customers import Customer, CustomerActivityLog, CustomerTransaction, TransactionType
from app.models.orders import Order, OrderItem, OrderItemStatus, OrderStatus
from app.models.products import Product, StockMovement
from app.repositories.customers_repository import CustomersRepository
from app.repositories.orders_repository import OrdersRepository
from app.repositories.products_repository import ProductsRepository
from app.schemas.orders import (
    DeliveredQuantityUpdate,
    OrderCreate,
    OrderItemRead,
    OrderItemUpdate,
    OrderListResponse,
    OrderRead,
    OrderUpdate,
)

logger = logging.getLogger(__name__)


class OrdersService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = OrdersRepository(db)
        self.customers_repo = CustomersRepository(db)
        self.products_repo = ProductsRepository(db)

    def list_orders(
        self,
        *,
        customer_id: int | None = None,
        status: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> OrderListResponse:
        items, total = self.repo.list_orders(
            customer_id=customer_id,
            status=status,
            search=search,
            offset=offset,
            limit=limit,
        )
        return OrderListResponse(
            items=[self._to_order_read(item) for item in items],
            total=total,
            offset=offset,
            limit=limit,
        )

    def get_order(self, order_id: int) -> OrderRead:
        return self._to_order_read(self._get_order_or_404(order_id))

    def _generate_order_number(self) -> str:
        count = self.db.execute(select(func.count(Order.id))).scalar() or 0
        return f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{count + 1:04d}"

    def create_order(self, payload: OrderCreate) -> OrderRead:
        customer = self.customers_repo.get_customer(payload.customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

        order = Order(
            order_number=self._generate_order_number(),
            customer_id=payload.customer_id,
            status=OrderStatus.PENDING,
            total_amount=Decimal("0"),
            notes=payload.notes,
            created_by=payload.created_by,
        )
        self.repo.add_order(order)

        total_amount = Decimal("0")
        for item_payload in payload.items:
            product = self._get_active_product_or_404(item_payload.product_id)
            self._unit_multiplier(product, item_payload.unit)

            unit_price = Decimal(str(product.selling_price))
            total_price = unit_price * Decimal(item_payload.requested_quantity)
            total_amount += total_price

            self.repo.add_order_item(
                OrderItem(
                    order_id=order.id,
                    product_id=item_payload.product_id,
                    product_name=product.name,
                    product_code=product.sku,
                    unit=item_payload.unit.strip(),
                    requested_quantity=item_payload.requested_quantity,
                    delivered_quantity=0,
                    remaining_quantity=item_payload.requested_quantity,
                    reserved_quantity_base=0,
                    unit_price=unit_price,
                    total_price=total_price,
                    status=OrderItemStatus.PENDING,
                )
            )

        order.total_amount = total_amount
        self._log_activity(
            customer,
            "ORDER_CREATED",
            f"Order {order.order_number} created",
            {"order_id": order.id, "order_number": order.order_number},
        )
        self.db.commit()
        return self._to_order_read(self._get_order_or_404(order.id))

    def update_order(self, order_id: int, payload: OrderUpdate) -> OrderRead:
        order = self._get_order_or_404(order_id)

        if payload.notes is not None:
            order.notes = payload.notes

        if payload.status is not None:
            if payload.status == OrderStatus.COMPLETED:
                return self.complete_order(order_id)

        self._refresh_order_status(order)
        self.db.commit()
        return self._to_order_read(self._get_order_or_404(order_id))

    def update_order_item(self, order_id: int, item_id: int, payload: OrderItemUpdate) -> OrderItemRead:
        order = self._get_order_or_404(order_id)
        self._ensure_editable(order)
        item = self._get_order_item_or_404(order_id, item_id)

        if payload.unit is not None:
            product = self._get_active_product_or_404(item.product_id)
            self._unit_multiplier(product, payload.unit)
            item.unit = payload.unit.strip()
            item.status = OrderItemStatus.PENDING

        if payload.requested_quantity is not None:
            item.requested_quantity = payload.requested_quantity
            item.status = OrderItemStatus.PENDING

        if payload.delivered_quantity is not None:
            if item.status == OrderItemStatus.DELIVERED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Delivered quantities cannot be edited after delivery. Recreate the order if this was entered incorrectly.",
                )
            item.delivered_quantity = payload.delivered_quantity

        if item.delivered_quantity > item.requested_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivered quantity cannot exceed requested quantity",
            )

        item.remaining_quantity = item.requested_quantity - item.delivered_quantity
        item.unit_price = Decimal(str(item.unit_price))
        item.total_price = item.unit_price * Decimal(item.requested_quantity)

        if payload.status is not None:
            self._apply_item_status(order, item, payload.status)

        self._recalculate_order_total(order)
        self._refresh_order_status(order)
        self.db.commit()
        return OrderItemRead.model_validate(item)

    def deliver_item(self, order_id: int, item_id: int, payload: DeliveredQuantityUpdate) -> OrderRead:
        order = self._get_order_or_404(order_id)
        self._ensure_editable(order)
        item = self._get_order_item_or_404(order_id, item_id)
        self._deliver_item(order, item, payload.delivered_quantity)
        self._refresh_order_status(order)
        self.db.commit()
        return self._to_order_read(self._get_order_or_404(order_id))

    def complete_order(self, order_id: int) -> OrderRead:
        order = self._get_order_or_404(order_id)
        if order.status == OrderStatus.COMPLETED:
            return self._to_order_read(order)

        customer = self.customers_repo.get_customer(order.customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

        delivered_amount = self._delivered_amount(order)
        now = datetime.utcnow()
        order.status = OrderStatus.COMPLETED
        order.completed_at = now
        order.total_amount = delivered_amount

        customer.total_orders_count = (customer.total_orders_count or 0) + 1
        customer.total_spent = Decimal(str(customer.total_spent or 0)) + delivered_amount
        customer.last_order_date = now

        if delivered_amount > 0:
            self.customers_repo.add_transaction(
                CustomerTransaction(
                    customer_id=customer.id,
                    transaction_type=TransactionType.CREDIT,
                    amount=delivered_amount,
                    reference_number=order.order_number,
                    transaction_date=now,
                    notes=f"Completed order {order.order_number}",
                    created_by=order.created_by,
                )
            )

        self._log_activity(
            customer,
            "ORDER_COMPLETED",
            f"Order {order.order_number} completed",
            {
                "order_id": order.id,
                "order_number": order.order_number,
                "delivered_amount": str(delivered_amount),
            },
        )
        self.db.commit()
        return self._to_order_read(self._get_order_or_404(order_id))

    def delete_order(self, order_id: int) -> None:
        order = self._get_order_or_404(order_id)
        if order.status == OrderStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Completed orders cannot be deleted because they are linked to the customer ledger.",
            )
        self.repo.delete_order(order)
        self.db.commit()

    def export_order_xlsx(self, order_id: int) -> tuple[bytes, str]:
        order = self._get_order_or_404(order_id)
        if order.status != OrderStatus.COMPLETED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only completed orders can be exported",
            )
        return self._build_xlsx(order), f"{order.order_number}.xlsx"

    def _apply_item_status(self, order: Order, item: OrderItem, next_status: str) -> None:
        if next_status == OrderItemStatus.DELIVERED:
            delivered_quantity = item.delivered_quantity or item.requested_quantity
            self._deliver_item(order, item, delivered_quantity)
        elif next_status == OrderItemStatus.OUT_OF_STOCK:
            item.status = OrderItemStatus.OUT_OF_STOCK
            item.delivered_quantity = 0
            item.remaining_quantity = item.requested_quantity
            self._log_activity(
                order.customer,
                "ORDER_ITEM_OUT_OF_STOCK",
                f"{item.product_name} marked out of stock for {order.order_number}",
                {"order_id": order.id, "item_id": item.id},
            )
        else:
            item.status = OrderItemStatus.PENDING

    def _deliver_item(self, order: Order, item: OrderItem, delivered_quantity: int) -> None:
        if delivered_quantity < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Delivered quantity cannot be negative")
        if delivered_quantity > item.requested_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Delivered quantity cannot exceed requested quantity",
            )

        product = self._get_active_product_or_404(item.product_id)
        delivered_base = self._quantity_in_base(product, item.unit, delivered_quantity)
        available_unreserved = product.stock_quantity or 0
        if delivered_base > available_unreserved:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough stock to deliver {product.name}",
            )

        previous_quantity = product.stock_quantity or 0
        new_quantity = previous_quantity - delivered_base
        if new_quantity < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock quantity cannot go below zero")

        product.stock_quantity = new_quantity
        product.total_units_sold = (product.total_units_sold or 0) + delivered_base
        product.total_income_generated = Decimal(str(product.total_income_generated or 0)) + (
            Decimal(str(product.selling_price)) * Decimal(delivered_quantity)
        )
        product.last_movement_date = datetime.utcnow()
        product.updated_at = datetime.utcnow()
        if product.inventory_record:
            product.inventory_record.quantity_base_unit = new_quantity
            product.inventory_record.updated_at = datetime.utcnow()

        self.db.add(
            StockMovement(
                product_id=product.id,
                quantity=delivered_base,
                previous_quantity=previous_quantity,
                new_quantity=new_quantity,
                movement_type="STOCK_OUT",
                type="STOCK_OUT",
                reference=order.order_number,
                notes=f"Delivered for order {order.order_number}",
                created_at=datetime.utcnow(),
            )
        )

        item.delivered_quantity = delivered_quantity
        item.remaining_quantity = item.requested_quantity - delivered_quantity
        item.status = OrderItemStatus.DELIVERED
        item.total_price = Decimal(str(item.unit_price)) * Decimal(delivered_quantity)
        self._log_activity(
            order.customer,
            "ORDER_ITEM_DELIVERED",
            f"{item.product_name} delivered for {order.order_number}",
            {"order_id": order.id, "item_id": item.id, "delivered_quantity": delivered_quantity},
        )

    def _refresh_order_status(self, order: Order) -> None:
        if order.status == OrderStatus.COMPLETED:
            return
        statuses = {item.status for item in order.items}
        if statuses and statuses <= {OrderItemStatus.DELIVERED, OrderItemStatus.OUT_OF_STOCK}:
            order.status = OrderStatus.COMPLETED
            order.completed_at = datetime.utcnow()
        else:
            order.status = OrderStatus.PENDING

    def _recalculate_order_total(self, order: Order) -> None:
        order.total_amount = sum((Decimal(str(item.total_price)) for item in order.items), Decimal("0"))

    def _delivered_amount(self, order: Order) -> Decimal:
        return sum(
            (Decimal(str(item.unit_price)) * Decimal(item.delivered_quantity or 0) for item in order.items),
            Decimal("0"),
        )

    def _unit_multiplier(self, product: Product, unit: str) -> int:
        normalized = unit.strip().lower()
        if normalized in {"base", product.base_unit.lower(), product.base_unit_name.lower()}:
            return 1
        if normalized in {"main", product.main_unit_name.lower()}:
            return max(product.conversion_factor or 1, 1)

        by_name = {product_unit.name.lower(): product_unit for product_unit in product.units}
        selected = by_name.get(normalized)
        if not selected:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid unit '{unit}' for {product.name}")
        if selected.is_base:
            return 1

        for conversion in product.conversions:
            if conversion.parent_unit_id == selected.id:
                child_multiplier = self._unit_multiplier(product, conversion.child_unit.name)
                return conversion.quantity * child_multiplier

        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unit '{unit}' has no conversion for {product.name}")

    def _quantity_in_base(self, product: Product, unit: str, quantity: int) -> int:
        return self._unit_multiplier(product, unit) * quantity

    def _get_active_product_or_404(self, product_id: int) -> Product:
        product = self.products_repo.get_product(product_id)
        if not product or product.status != "ACTIVE":
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product with id {product_id} not found")
        return product

    def _get_order_or_404(self, order_id: int) -> Order:
        order = self.repo.get_order(order_id)
        if not order:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
        return order

    def _get_order_item_or_404(self, order_id: int, item_id: int) -> OrderItem:
        item = self.repo.get_order_item(item_id)
        if not item or item.order_id != order_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order item not found")
        return item

    def _ensure_editable(self, order: Order) -> None:
        if order.status == OrderStatus.COMPLETED:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Completed orders cannot be edited")

    def _to_order_read(self, order: Order) -> OrderRead:
        customer_name = order.customer.full_name if order.customer else None
        return OrderRead(
            id=order.id,
            order_number=order.order_number,
            customer_id=order.customer_id,
            customer_name=customer_name,
            status=order.status,
            total_amount=order.total_amount,
            notes=order.notes,
            created_by=order.created_by,
            completed_at=order.completed_at,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=[OrderItemRead.model_validate(item) for item in order.items],
        )

    def _log_activity(self, customer: Customer | None, event_type: str, description: str, metadata: dict | None = None) -> None:
        if not customer:
            return
        self.customers_repo.add_activity_log(
            CustomerActivityLog(
                customer_id=customer.id,
                event_type=event_type,
                description=description,
                metadata_json=json.dumps(metadata) if metadata else None,
            )
        )

    def _build_xlsx(self, order: Order) -> bytes:
        rows: list[list[str | int | Decimal]] = [
            ["Company Name", "RIBBON LINE"],
            ["Order Number", order.order_number],
            ["Customer", order.customer.full_name if order.customer else ""],
            ["Date", (order.completed_at or order.created_at).strftime("%Y-%m-%d")],
            [],
            ["Product", "Code", "Unit", "Requested", "Delivered", "Remaining", "Status", "Total"],
        ]
        for item in order.items:
            rows.append(
                [
                    item.product_name,
                    item.product_code or "",
                    item.unit,
                    item.requested_quantity,
                    item.delivered_quantity,
                    item.remaining_quantity,
                    item.status.replace("_", " ").title(),
                    item.total_price,
                ]
            )
        rows.extend([[], ["Notes", order.notes or ""], ["Total", "", "", "", "", "", "", order.total_amount]])

        sheet_xml = self._xlsx_sheet_xml(rows)
        content_types = """<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>"""
        rels = """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>"""
        workbook = """<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Order" sheetId="1" r:id="rId1"/></sheets></workbook>"""
        workbook_rels = """<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>"""
        styles = """<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEDE9FE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"/><right style="thin"/><top style="thin"/><bottom style="thin"/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1"/></cellXfs></styleSheet>"""

        output = io.BytesIO()
        with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", content_types)
            archive.writestr("_rels/.rels", rels)
            archive.writestr("xl/workbook.xml", workbook)
            archive.writestr("xl/_rels/workbook.xml.rels", workbook_rels)
            archive.writestr("xl/styles.xml", styles)
            archive.writestr("xl/worksheets/sheet1.xml", sheet_xml)
        return output.getvalue()

    def _xlsx_sheet_xml(self, rows: list[list[str | int | Decimal]]) -> str:
        column_widths = "".join(f'<col min="{index}" max="{index}" width="18" customWidth="1"/>' for index in range(1, 9))
        row_xml: list[str] = []
        for row_index, row in enumerate(rows, start=1):
            cells: list[str] = []
            for column_index, value in enumerate(row, start=1):
                cell_ref = f"{chr(64 + column_index)}{row_index}"
                style = 1 if row_index in {1, 6} else 2 if row_index > 6 and row else 0
                if isinstance(value, (int, Decimal)):
                    cells.append(f'<c r="{cell_ref}" s="{style}"><v>{value}</v></c>')
                else:
                    cells.append(f'<c r="{cell_ref}" s="{style}" t="inlineStr"><is><t>{escape(str(value))}</t></is></c>')
            row_xml.append(f'<row r="{row_index}">{"".join(cells)}</row>')
        return f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>{column_widths}</cols><sheetData>{"".join(row_xml)}</sheetData></worksheet>'
