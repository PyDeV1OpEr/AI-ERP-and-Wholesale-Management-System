from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field, EmailStr


# ─── Customer Create / Update ──────────────────────────────────────────────────

class CustomerCreate(BaseModel):
    full_name: str = Field(min_length=2, max_length=160)
    company_name: str | None = None
    email: EmailStr | None = None
    phone_number: str = Field(min_length=1, max_length=50)
    whatsapp_number: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    postal_code: str | None = None
    customer_type: str = Field(default="RETAIL")
    status: str = Field(default="ACTIVE")
    credit_limit: Decimal = Field(default=Decimal("0"), ge=0)


class CustomerUpdate(BaseModel):
    full_name: str | None = Field(None, min_length=2, max_length=160)
    company_name: str | None = None
    email: EmailStr | None = None
    phone_number: str | None = Field(None, min_length=1, max_length=50)
    whatsapp_number: str | None = None
    address: str | None = None
    city: str | None = None
    country: str | None = None
    postal_code: str | None = None
    customer_type: str | None = None
    status: str | None = None
    credit_limit: Decimal | None = None


# ─── Customer Read ─────────────────────────────────────────────────────────────

class CustomerRead(BaseModel):
    id: int
    customer_code: str | None
    full_name: str
    company_name: str | None
    email: str | None
    phone_number: str
    whatsapp_number: str | None
    address: str | None
    city: str | None
    country: str | None
    postal_code: str | None
    customer_type: str
    status: str
    credit_limit: Decimal
    total_orders_count: int
    total_spent: Decimal
    last_order_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CustomerListResponse(BaseModel):
    items: list[CustomerRead]
    total: int
    offset: int
    limit: int


class CustomerSummary(BaseModel):
    id: int
    customer_code: str | None
    full_name: str
    company_name: str | None
    email: str | None
    phone_number: str
    status: str
    customer_type: str
    total_orders_count: int
    total_spent: Decimal
    last_order_date: datetime | None

    model_config = {"from_attributes": True}


# ─── Transactions ──────────────────────────────────────────────────────────────

class CustomerTransactionCreate(BaseModel):
    transaction_type: str = Field(pattern="^(CREDIT|DEBIT)$")
    amount: Decimal = Field(gt=0)
    payment_method: str | None = Field(None, pattern="^(CASH|BANK_TRANSFER|CHEQUE)?$")
    reference_number: str | None = None
    transaction_date: datetime | None = None
    notes: str | None = None
    created_by: str | None = None


class CustomerTransactionRead(BaseModel):
    id: int
    customer_id: int
    transaction_type: str
    amount: Decimal
    payment_method: str | None
    reference_number: str | None
    transaction_date: datetime
    notes: str | None
    created_by: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class CustomerTransactionListResponse(BaseModel):
    items: list[CustomerTransactionRead]
    total: int
    offset: int
    limit: int


# ─── Notes ────────────────────────────────────────────────────────────────────

class CustomerNoteCreate(BaseModel):
    content: str = Field(min_length=1)
    created_by: str | None = None


class CustomerNoteUpdate(BaseModel):
    content: str = Field(min_length=1)


class CustomerNoteRead(BaseModel):
    id: int
    customer_id: int
    content: str
    created_by: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Cheques ──────────────────────────────────────────────────────────────────

class CustomerChequeCreate(BaseModel):
    cheque_number: str = Field(min_length=1, max_length=100)
    bank_name: str | None = None
    cheque_date: datetime
    amount: Decimal = Field(gt=0)
    reference: str | None = None
    notes: str | None = None


class CustomerChequeUpdate(BaseModel):
    status: str = Field(pattern="^(PENDING|CLEARED|BOUNCED|CANCELLED)$")
    notes: str | None = None


class CustomerChequeRead(BaseModel):
    id: int
    customer_id: int
    cheque_number: str
    bank_name: str | None
    cheque_date: datetime
    amount: Decimal
    status: str
    reference: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ─── Activity Log ─────────────────────────────────────────────────────────────

class CustomerActivityLogRead(BaseModel):
    id: int
    customer_id: int
    event_type: str
    description: str
    metadata_json: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ─── KPIs & Ledger ────────────────────────────────────────────────────────────

class CustomerKpiResponse(BaseModel):
    outstanding_balance: Decimal
    credit_limit: Decimal
    available_credit: Decimal
    total_credit_added: Decimal
    total_payments_received: Decimal
    total_transactions: int
    last_transaction_date: datetime | None
    customer_since: datetime


class LedgerEntry(BaseModel):
    date: datetime
    description: str
    debit: Decimal
    credit: Decimal
    balance: Decimal
    transaction_id: int | None = None


class CustomerLedgerResponse(BaseModel):
    entries: list[LedgerEntry]
    opening_balance: Decimal
    closing_balance: Decimal


# ─── Full Profile ─────────────────────────────────────────────────────────────

class CustomerProfileResponse(BaseModel):
    customer: CustomerRead
    kpis: CustomerKpiResponse
    recent_transactions: list[CustomerTransactionRead]
    recent_notes: list[CustomerNoteRead]
    recent_activity: list[CustomerActivityLogRead]
