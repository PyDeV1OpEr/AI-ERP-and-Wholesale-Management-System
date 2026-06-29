from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from sqlalchemy import (
    DateTime, ForeignKey, Index, Integer, Numeric, String, Text, func
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CustomerStatus:
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    BLOCKED = "BLOCKED"
    VIP = "VIP"
    CREDIT_HOLD = "CREDIT_HOLD"


class CustomerType:
    RETAIL = "RETAIL"
    WHOLESALE = "WHOLESALE"
    VIP = "VIP"
    DISTRIBUTOR = "DISTRIBUTOR"


class TransactionType:
    CREDIT = "CREDIT"  # Money owed by customer (goods sold)
    DEBIT = "DEBIT"    # Money received from customer (payment)


class PaymentMethod:
    CASH = "CASH"
    BANK_TRANSFER = "BANK_TRANSFER"
    CHEQUE = "CHEQUE"


class ChequeStatus:
    PENDING = "PENDING"
    CLEARED = "CLEARED"
    BOUNCED = "BOUNCED"
    CANCELLED = "CANCELLED"


class Customer(Base):
    __tablename__ = "customers"
    __table_args__ = (
        Index("ix_customers_status_updated", "status", "updated_at"),
        Index("ix_customers_phone", "phone_number"),
        Index("ix_customers_code", "customer_code"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_code: Mapped[str | None] = mapped_column(String(20), nullable=True, unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    company_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    whatsapp_number: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    country: Mapped[str | None] = mapped_column(String(100), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    customer_type: Mapped[str] = mapped_column(String(20), nullable=False, default=CustomerType.RETAIL)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=CustomerStatus.ACTIVE, index=True)
    credit_limit: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    # Legacy fields kept for backward compat — not primary source of truth for financials
    total_orders_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_spent: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0)
    last_order_date: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    transactions: Mapped[list[CustomerTransaction]] = relationship(
        "CustomerTransaction", back_populates="customer", cascade="all, delete-orphan"
    )
    notes: Mapped[list[CustomerNote]] = relationship(
        "CustomerNote", back_populates="customer", cascade="all, delete-orphan"
    )
    cheques: Mapped[list[CustomerCheque]] = relationship(
        "CustomerCheque", back_populates="customer", cascade="all, delete-orphan"
    )
    activity_logs: Mapped[list[CustomerActivityLog]] = relationship(
        "CustomerActivityLog", back_populates="customer", cascade="all, delete-orphan"
    )
    orders: Mapped[list["Order"]] = relationship(
        "Order", back_populates="customer", cascade="all, delete-orphan"
    )


class CustomerTransaction(Base):
    __tablename__ = "customer_transactions"
    __table_args__ = (
        Index("ix_cust_tx_customer_date", "customer_id", "transaction_date"),
        Index("ix_cust_tx_type", "transaction_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    transaction_type: Mapped[str] = mapped_column(String(10), nullable=False)  # CREDIT / DEBIT
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_method: Mapped[str | None] = mapped_column(String(20), nullable=True)  # CASH / BANK_TRANSFER / CHEQUE
    reference_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transaction_date: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="transactions")


class CustomerNote(Base):
    __tablename__ = "customer_notes"
    __table_args__ = (
        Index("ix_cust_notes_customer", "customer_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="notes")


class CustomerCheque(Base):
    __tablename__ = "customer_cheques"
    __table_args__ = (
        Index("ix_cust_cheques_customer", "customer_id"),
        Index("ix_cust_cheques_status", "status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    cheque_number: Mapped[str] = mapped_column(String(100), nullable=False)
    bank_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    cheque_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=ChequeStatus.PENDING)
    reference: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="cheques")


class CustomerActivityLog(Base):
    __tablename__ = "customer_activity_logs"
    __table_args__ = (
        Index("ix_cust_activity_customer_created", "customer_id", "created_at"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    metadata_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False, server_default=func.now())

    customer: Mapped[Customer] = relationship("Customer", back_populates="activity_logs")
