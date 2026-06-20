from __future__ import annotations

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.models.customers import Customer, CustomerStatus


class CustomersRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_customers(
        self,
        *,
        search: str | None,
        status: str | None,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[Customer], int]:
        query: Select[tuple[Customer]] = select(Customer)
        count_query = select(func.count(Customer.id))

        if status:
            query = query.where(Customer.status == status)
            count_query = count_query.where(Customer.status == status)

        if search:
            search_clause = or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone_number.ilike(f"%{search}%"),
            )
            query = query.where(search_clause)
            count_query = count_query.where(search_clause)

        query = query.order_by(Customer.updated_at.desc(), Customer.created_at.desc())
        query = query.offset(offset).limit(limit)

        items = self.db.execute(query).scalars().all()
        total = self.db.execute(count_query).scalar_one()
        return items, total

    def get_customer(self, customer_id: int) -> Customer | None:
        query = select(Customer).where(Customer.id == customer_id)
        return self.db.execute(query).scalars().first()

    def get_customer_by_email(self, email: str) -> Customer | None:
        query = select(Customer).where(Customer.email == email)
        return self.db.execute(query).scalars().first()

    def add_customer(self, customer: Customer) -> Customer:
        self.db.add(customer)
        self.db.flush()
        return customer

    def delete_customer(self, customer: Customer) -> None:
        self.db.delete(customer)
        self.db.flush()
