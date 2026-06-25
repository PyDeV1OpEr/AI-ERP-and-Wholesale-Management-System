from __future__ import annotations

from typing import Sequence
from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session
from decimal import Decimal

from app.models.customers import (
    Customer, CustomerStatus, CustomerTransaction, CustomerNote,
    CustomerCheque, CustomerActivityLog, TransactionType
)


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
    ) -> tuple[Sequence[Customer], int]:
        query = select(Customer)
        count_query = select(func.count(Customer.id))

        if status:
            query = query.where(Customer.status == status)
            count_query = count_query.where(Customer.status == status)

        if search:
            search_clause = or_(
                Customer.full_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%"),
                Customer.phone_number.ilike(f"%{search}%"),
                Customer.customer_code.ilike(f"%{search}%"),
                Customer.company_name.ilike(f"%{search}%"),
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

    # --- Transactions ---

    def list_transactions(
        self,
        customer_id: int,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[Sequence[CustomerTransaction], int]:
        query = select(CustomerTransaction).where(CustomerTransaction.customer_id == customer_id)
        count_query = select(func.count(CustomerTransaction.id)).where(CustomerTransaction.customer_id == customer_id)

        query = query.order_by(CustomerTransaction.transaction_date.desc(), CustomerTransaction.id.desc())
        query = query.offset(offset).limit(limit)

        items = self.db.execute(query).scalars().all()
        total = self.db.execute(count_query).scalar_one()
        return items, total

    def add_transaction(self, tx: CustomerTransaction) -> CustomerTransaction:
        self.db.add(tx)
        self.db.flush()
        return tx

    def get_outstanding_balance(self, customer_id: int) -> Decimal:
        query = select(
            func.sum(CustomerTransaction.amount).label("total_credit")
        ).where(
            CustomerTransaction.customer_id == customer_id,
            CustomerTransaction.transaction_type == TransactionType.CREDIT
        )
        total_credit = self.db.execute(query).scalar() or Decimal("0")

        query_debit = select(
            func.sum(CustomerTransaction.amount).label("total_debit")
        ).where(
            CustomerTransaction.customer_id == customer_id,
            CustomerTransaction.transaction_type == TransactionType.DEBIT
        )
        total_debit = self.db.execute(query_debit).scalar() or Decimal("0")

        return Decimal(total_credit) - Decimal(total_debit)

    def get_financial_kpis(self, customer_id: int) -> dict:
        # outstanding balance
        balance = self.get_outstanding_balance(customer_id)
        
        # total credit added
        query = select(func.sum(CustomerTransaction.amount)).where(
            CustomerTransaction.customer_id == customer_id,
            CustomerTransaction.transaction_type == TransactionType.CREDIT
        )
        total_credit_added = self.db.execute(query).scalar() or Decimal("0")

        # total payments received
        query = select(func.sum(CustomerTransaction.amount)).where(
            CustomerTransaction.customer_id == customer_id,
            CustomerTransaction.transaction_type == TransactionType.DEBIT
        )
        total_payments_received = self.db.execute(query).scalar() or Decimal("0")

        # total transactions
        query = select(func.count(CustomerTransaction.id)).where(
            CustomerTransaction.customer_id == customer_id
        )
        total_tx = self.db.execute(query).scalar() or 0

        # last transaction date
        query = select(func.max(CustomerTransaction.transaction_date)).where(
            CustomerTransaction.customer_id == customer_id
        )
        last_tx_date = self.db.execute(query).scalar()

        return {
            "outstanding_balance": balance,
            "total_credit_added": total_credit_added,
            "total_payments_received": total_payments_received,
            "total_transactions": total_tx,
            "last_transaction_date": last_tx_date,
        }

    # --- Notes ---

    def list_notes(self, customer_id: int) -> Sequence[CustomerNote]:
        query = select(CustomerNote).where(CustomerNote.customer_id == customer_id).order_by(CustomerNote.created_at.desc())
        return self.db.execute(query).scalars().all()

    def get_note(self, note_id: int) -> CustomerNote | None:
        return self.db.execute(select(CustomerNote).where(CustomerNote.id == note_id)).scalars().first()

    def add_note(self, note: CustomerNote) -> CustomerNote:
        self.db.add(note)
        self.db.flush()
        return note

    def delete_note(self, note: CustomerNote) -> None:
        self.db.delete(note)
        self.db.flush()

    # --- Cheques ---

    def list_cheques(self, customer_id: int) -> Sequence[CustomerCheque]:
        query = select(CustomerCheque).where(CustomerCheque.customer_id == customer_id).order_by(CustomerCheque.cheque_date.desc())
        return self.db.execute(query).scalars().all()

    def get_cheque(self, cheque_id: int) -> CustomerCheque | None:
        return self.db.execute(select(CustomerCheque).where(CustomerCheque.id == cheque_id)).scalars().first()

    def add_cheque(self, cheque: CustomerCheque) -> CustomerCheque:
        self.db.add(cheque)
        self.db.flush()
        return cheque

    # --- Activity Logs ---

    def list_activity_logs(self, customer_id: int, limit: int = 20) -> Sequence[CustomerActivityLog]:
        query = select(CustomerActivityLog).where(CustomerActivityLog.customer_id == customer_id).order_by(CustomerActivityLog.created_at.desc()).limit(limit)
        return self.db.execute(query).scalars().all()

    def add_activity_log(self, log: CustomerActivityLog) -> CustomerActivityLog:
        self.db.add(log)
        self.db.flush()
        return log
