from __future__ import annotations

import logging
import json
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.customers import (
    Customer, CustomerStatus, CustomerType, CustomerTransaction,
    CustomerNote, CustomerCheque, CustomerActivityLog, TransactionType
)
from app.repositories.customers_repository import CustomersRepository
from app.schemas.customers import (
    CustomerCreate,
    CustomerListResponse,
    CustomerRead,
    CustomerSummary,
    CustomerUpdate,
    CustomerTransactionCreate, CustomerTransactionRead, CustomerTransactionListResponse,
    CustomerNoteCreate, CustomerNoteRead, CustomerNoteUpdate,
    CustomerChequeCreate, CustomerChequeRead, CustomerChequeUpdate,
    CustomerActivityLogRead,
    CustomerProfileResponse,
    CustomerKpiResponse, CustomerLedgerResponse, LedgerEntry
)

logger = logging.getLogger(__name__)


class CustomersService:
    def __init__(self, db: Session):
        self.repo = CustomersRepository(db)
        self.db = db

    # --- Customer Core ---

    def list_customers(
        self,
        *,
        search: str | None,
        status: str | None,
        offset: int = 0,
        limit: int = 50,
    ) -> CustomerListResponse:
        items, total = self.repo.list_customers(
            search=search,
            status=status,
            offset=offset,
            limit=limit,
        )
        return CustomerListResponse(
            items=[self._to_customer_read(item) for item in items],
            total=total,
            offset=offset,
            limit=limit,
        )

    def get_customer(self, customer_id: int) -> CustomerRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return self._to_customer_read(customer)

    def get_customer_summary(self, customer_id: int) -> CustomerSummary:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        return CustomerSummary.model_validate(customer)

    def _generate_customer_code(self) -> str:
        # Simple implementation: get count and append. In prod, might use a sequence table
        from sqlalchemy import select, func
        count = self.db.execute(select(func.count(Customer.id))).scalar() or 0
        return f"CUS-{count + 1:04d}"

    def create_customer(self, payload: CustomerCreate) -> CustomerRead:
        if payload.email:
            existing = self.repo.get_customer_by_email(payload.email)
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer with this email already exists",
                )
        customer = Customer(
            customer_code=self._generate_customer_code(),
            full_name=payload.full_name.strip(),
            company_name=payload.company_name,
            email=payload.email,
            phone_number=payload.phone_number.strip(),
            whatsapp_number=payload.whatsapp_number,
            address=payload.address,
            city=payload.city,
            country=payload.country,
            postal_code=payload.postal_code,
            customer_type=payload.customer_type,
            status=payload.status,
            credit_limit=payload.credit_limit,
        )
        self.repo.add_customer(customer)
        self._log_activity(customer, "CUSTOMER_CREATED", "Customer account created")
        self.db.commit()
        return self._to_customer_read(customer)

    def update_customer(self, customer_id: int, payload: CustomerUpdate) -> CustomerRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
        updated_fields = []
        if payload.full_name is not None and payload.full_name != customer.full_name:
            customer.full_name = payload.full_name.strip()
            updated_fields.append("full_name")
        if payload.email is not None and payload.email != customer.email:
            existing = self.repo.get_customer_by_email(payload.email)
            if existing and existing.id != customer.id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Customer with this email already exists",
                )
            customer.email = payload.email
            updated_fields.append("email")
        if payload.company_name is not None:
            customer.company_name = payload.company_name
            updated_fields.append("company_name")
        if payload.phone_number is not None:
            customer.phone_number = payload.phone_number.strip()
            updated_fields.append("phone_number")
        if payload.whatsapp_number is not None:
            customer.whatsapp_number = payload.whatsapp_number
            updated_fields.append("whatsapp_number")
        if payload.address is not None:
            customer.address = payload.address
            updated_fields.append("address")
        if payload.city is not None:
            customer.city = payload.city
            updated_fields.append("city")
        if payload.country is not None:
            customer.country = payload.country
            updated_fields.append("country")
        if payload.postal_code is not None:
            customer.postal_code = payload.postal_code
            updated_fields.append("postal_code")
        if payload.customer_type is not None:
            customer.customer_type = payload.customer_type
            updated_fields.append("customer_type")
        if payload.status is not None:
            customer.status = payload.status
            updated_fields.append("status")
        if payload.credit_limit is not None:
            customer.credit_limit = payload.credit_limit
            updated_fields.append("credit_limit")
        
        if updated_fields:
            self._log_activity(customer, "CUSTOMER_UPDATED", f"Updated fields: {', '.join(updated_fields)}")
            self.db.commit()
            
        return self._to_customer_read(customer)

    def delete_customer(self, customer_id: int) -> None:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        self.repo.delete_customer(customer)
        self.db.commit()

    def _to_customer_read(self, customer: Customer) -> CustomerRead:
        return CustomerRead.model_validate(customer)

    def _log_activity(self, customer: Customer, event_type: str, description: str, metadata: dict | None = None) -> None:
        log = CustomerActivityLog(
            customer_id=customer.id,
            event_type=event_type,
            description=description,
            metadata_json=json.dumps(metadata) if metadata else None
        )
        self.repo.add_activity_log(log)

    # --- Transactions ---

    def list_transactions(self, customer_id: int, offset: int = 0, limit: int = 50) -> CustomerTransactionListResponse:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        items, total = self.repo.list_transactions(customer_id, offset, limit)
        return CustomerTransactionListResponse(
            items=[CustomerTransactionRead.model_validate(item) for item in items],
            total=total, offset=offset, limit=limit
        )

    def add_transaction(self, customer_id: int, payload: CustomerTransactionCreate) -> CustomerTransactionRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
        tx = CustomerTransaction(
            customer_id=customer.id,
            transaction_type=payload.transaction_type,
            amount=payload.amount,
            payment_method=payload.payment_method,
            reference_number=payload.reference_number,
            transaction_date=payload.transaction_date,
            notes=payload.notes,
            created_by=payload.created_by
        )
        self.repo.add_transaction(tx)
        
        self._log_activity(customer, "TRANSACTION_ADDED", f"Added {payload.transaction_type} transaction for {payload.amount}")
        self.db.commit()
        return CustomerTransactionRead.model_validate(tx)

    # --- Notes ---

    def list_notes(self, customer_id: int) -> list[CustomerNoteRead]:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        notes = self.repo.list_notes(customer_id)
        return [CustomerNoteRead.model_validate(n) for n in notes]

    def add_note(self, customer_id: int, payload: CustomerNoteCreate) -> CustomerNoteRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
        note = CustomerNote(
            customer_id=customer_id,
            content=payload.content,
            created_by=payload.created_by
        )
        self.repo.add_note(note)
        self._log_activity(customer, "NOTE_ADDED", "Added a new note")
        self.db.commit()
        return CustomerNoteRead.model_validate(note)

    def update_note(self, customer_id: int, note_id: int, payload: CustomerNoteUpdate) -> CustomerNoteRead:
        note = self.repo.get_note(note_id)
        if not note or note.customer_id != customer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        
        note.content = payload.content
        self.db.commit()
        return CustomerNoteRead.model_validate(note)

    def delete_note(self, customer_id: int, note_id: int) -> None:
        note = self.repo.get_note(note_id)
        if not note or note.customer_id != customer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")
        self.repo.delete_note(note)
        self.db.commit()

    # --- Cheques ---

    def list_cheques(self, customer_id: int) -> list[CustomerChequeRead]:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        cheques = self.repo.list_cheques(customer_id)
        return [CustomerChequeRead.model_validate(c) for c in cheques]

    def add_cheque(self, customer_id: int, payload: CustomerChequeCreate) -> CustomerChequeRead:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
        
        cheque = CustomerCheque(
            customer_id=customer_id,
            cheque_number=payload.cheque_number,
            bank_name=payload.bank_name,
            cheque_date=payload.cheque_date,
            amount=payload.amount,
            reference=payload.reference,
            notes=payload.notes,
        )
        self.repo.add_cheque(cheque)
        self._log_activity(customer, "CHEQUE_ADDED", f"Added cheque {payload.cheque_number} for {payload.amount}")
        self.db.commit()
        return CustomerChequeRead.model_validate(cheque)

    def update_cheque(self, customer_id: int, cheque_id: int, payload: CustomerChequeUpdate) -> CustomerChequeRead:
        cheque = self.repo.get_cheque(cheque_id)
        if not cheque or cheque.customer_id != customer_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cheque not found")
        
        old_status = cheque.status
        cheque.status = payload.status
        if payload.notes is not None:
            cheque.notes = payload.notes
            
        if old_status != payload.status:
            customer = self.repo.get_customer(customer_id)
            self._log_activity(customer, "CHEQUE_UPDATED", f"Cheque {cheque.cheque_number} status changed to {payload.status}")
            
        self.db.commit()
        return CustomerChequeRead.model_validate(cheque)

    # --- Profiles & KPIs ---

    def get_financial_kpis(self, customer_id: int) -> CustomerKpiResponse:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
            
        kpis = self.repo.get_financial_kpis(customer_id)
        
        # Calculate available credit (cannot be less than 0)
        credit_limit = customer.credit_limit
        balance = kpis["outstanding_balance"]
        
        available_credit = Decimal("0")
        if credit_limit > 0:
            available_credit = max(Decimal("0"), credit_limit - balance)
            
        return CustomerKpiResponse(
            outstanding_balance=balance,
            credit_limit=credit_limit,
            available_credit=available_credit,
            total_credit_added=kpis["total_credit_added"],
            total_payments_received=kpis["total_payments_received"],
            total_transactions=kpis["total_transactions"],
            last_transaction_date=kpis["last_transaction_date"],
            customer_since=customer.created_at,
        )

    def get_customer_profile(self, customer_id: int) -> CustomerProfileResponse:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
            
        kpis = self.get_financial_kpis(customer_id)
        txs, _ = self.repo.list_transactions(customer_id, 0, 5)
        notes = self.repo.list_notes(customer_id)[:5]
        logs = self.repo.list_activity_logs(customer_id, 5)
        
        return CustomerProfileResponse(
            customer=self._to_customer_read(customer),
            kpis=kpis,
            recent_transactions=[CustomerTransactionRead.model_validate(tx) for tx in txs],
            recent_notes=[CustomerNoteRead.model_validate(n) for n in notes],
            recent_activity=[CustomerActivityLogRead.model_validate(log) for log in logs]
        )

    def get_ledger(self, customer_id: int) -> CustomerLedgerResponse:
        customer = self.repo.get_customer(customer_id)
        if not customer:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
            
        # Get all transactions sorted chronologically (oldest first)
        from sqlalchemy import select
        query = select(CustomerTransaction).where(CustomerTransaction.customer_id == customer_id).order_by(CustomerTransaction.transaction_date.asc(), CustomerTransaction.id.asc())
        txs = self.db.execute(query).scalars().all()
        
        entries = []
        running_balance = Decimal("0")
        
        for tx in txs:
            debit = tx.amount if tx.transaction_type == TransactionType.DEBIT else Decimal("0")
            credit = tx.amount if tx.transaction_type == TransactionType.CREDIT else Decimal("0")
            
            # Balance logic: credit increases balance owed, debit reduces balance owed
            running_balance = running_balance + credit - debit
            
            desc = f"{tx.transaction_type} - {tx.payment_method or ''}"
            if tx.reference_number:
                desc += f" ({tx.reference_number})"
                
            entries.append(LedgerEntry(
                date=tx.transaction_date,
                description=desc.strip(" - "),
                debit=debit,
                credit=credit,
                balance=running_balance,
                transaction_id=tx.id
            ))
            
        # Add reverse order so newest is first in the response
        entries.reverse()
        
        return CustomerLedgerResponse(
            entries=entries,
            opening_balance=Decimal("0"),
            closing_balance=running_balance
        )
