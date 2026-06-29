from __future__ import annotations

from typing import Sequence
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.orders import Order, OrderItem
from app.models.customers import Customer


class OrdersRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_orders(
        self,
        *,
        customer_id: int | None = None,
        status: str | None = None,
        search: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[Sequence[Order], int]:
        query = select(Order).options(
            selectinload(Order.items),
            selectinload(Order.customer),
        )
        count_query = select(func.count()).select_from(Order)

        if customer_id is not None:
            query = query.where(Order.customer_id == customer_id)
            count_query = count_query.where(Order.customer_id == customer_id)

        if status:
            query = query.where(Order.status == status)
            count_query = count_query.where(Order.status == status)

        if search:
            search_clause = or_(
                Order.order_number.ilike(f"%{search}%"),
                Customer.full_name.ilike(f"%{search}%"),
            )
            query = query.join(Order.customer).where(search_clause)
            count_query = count_query.join(Order.customer).where(search_clause)

        query = query.order_by(Order.created_at.desc())
        query = query.offset(offset).limit(limit)

        items = self.db.execute(query).scalars().all()
        total = self.db.execute(count_query).scalar_one()
        return items, total

    def get_order(self, order_id: int) -> Order | None:
        query = (
            select(Order)
            .where(Order.id == order_id)
            .options(
                selectinload(Order.items),
                selectinload(Order.customer),
            )
        )
        return self.db.execute(query).scalars().first()

    def get_order_by_number(self, order_number: str) -> Order | None:
        query = (
            select(Order)
            .where(Order.order_number == order_number)
            .options(
                selectinload(Order.items),
                selectinload(Order.customer),
            )
        )
        return self.db.execute(query).scalars().first()

    def add_order(self, order: Order) -> Order:
        self.db.add(order)
        self.db.flush()
        return order

    def add_order_item(self, item: OrderItem) -> OrderItem:
        self.db.add(item)
        self.db.flush()
        return item

    def delete_order(self, order: Order) -> None:
        self.db.delete(order)
        self.db.flush()

    def get_order_item(self, item_id: int) -> OrderItem | None:
        return self.db.execute(select(OrderItem).where(OrderItem.id == item_id)).scalars().first()
