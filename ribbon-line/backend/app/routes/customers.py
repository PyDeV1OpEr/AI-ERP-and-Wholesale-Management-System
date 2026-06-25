from __future__ import annotations

from typing import List

from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session

from app.database import get_db
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
    CustomerKpiResponse, CustomerLedgerResponse
)
from app.services.customers_service import CustomersService

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=CustomerListResponse)
def list_customers(
    search: str | None = Query(None),
    status: str | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    return CustomersService(db).list_customers(
        search=search,
        status=status,
        offset=offset,
        limit=limit,
    )


@router.post("", response_model=CustomerRead, status_code=status.HTTP_201_CREATED)
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
    return CustomersService(db).create_customer(payload)


@router.get("/{customer_id}", response_model=CustomerRead)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_customer(customer_id)


@router.put("/{customer_id}", response_model=CustomerRead)
def update_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    return CustomersService(db).update_customer(customer_id, payload)


@router.delete("/{customer_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    CustomersService(db).delete_customer(customer_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{customer_id}/summary", response_model=CustomerSummary)
def get_customer_summary(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_customer_summary(customer_id)


@router.get("/{customer_id}/profile", response_model=CustomerProfileResponse)
def get_customer_profile(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_customer_profile(customer_id)


@router.get("/{customer_id}/kpis", response_model=CustomerKpiResponse)
def get_customer_kpis(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_financial_kpis(customer_id)


@router.get("/{customer_id}/ledger", response_model=CustomerLedgerResponse)
def get_customer_ledger(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).get_ledger(customer_id)


# --- Transactions ---

@router.get("/{customer_id}/transactions", response_model=CustomerTransactionListResponse)
def list_transactions(
    customer_id: int,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return CustomersService(db).list_transactions(customer_id, offset, limit)


@router.post("/{customer_id}/transactions", response_model=CustomerTransactionRead, status_code=status.HTTP_201_CREATED)
def add_transaction(customer_id: int, payload: CustomerTransactionCreate, db: Session = Depends(get_db)):
    return CustomersService(db).add_transaction(customer_id, payload)


# --- Notes ---

@router.get("/{customer_id}/notes", response_model=List[CustomerNoteRead])
def list_notes(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).list_notes(customer_id)


@router.post("/{customer_id}/notes", response_model=CustomerNoteRead, status_code=status.HTTP_201_CREATED)
def add_note(customer_id: int, payload: CustomerNoteCreate, db: Session = Depends(get_db)):
    return CustomersService(db).add_note(customer_id, payload)


@router.put("/{customer_id}/notes/{note_id}", response_model=CustomerNoteRead)
def update_note(customer_id: int, note_id: int, payload: CustomerNoteUpdate, db: Session = Depends(get_db)):
    return CustomersService(db).update_note(customer_id, note_id, payload)


@router.delete("/{customer_id}/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(customer_id: int, note_id: int, db: Session = Depends(get_db)):
    CustomersService(db).delete_note(customer_id, note_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- Cheques ---

@router.get("/{customer_id}/cheques", response_model=List[CustomerChequeRead])
def list_cheques(customer_id: int, db: Session = Depends(get_db)):
    return CustomersService(db).list_cheques(customer_id)


@router.post("/{customer_id}/cheques", response_model=CustomerChequeRead, status_code=status.HTTP_201_CREATED)
def add_cheque(customer_id: int, payload: CustomerChequeCreate, db: Session = Depends(get_db)):
    return CustomersService(db).add_cheque(customer_id, payload)


@router.put("/{customer_id}/cheques/{cheque_id}", response_model=CustomerChequeRead)
def update_cheque(customer_id: int, cheque_id: int, payload: CustomerChequeUpdate, db: Session = Depends(get_db)):
    return CustomersService(db).update_cheque(customer_id, cheque_id, payload)


# --- Activity Logs ---

@router.get("/{customer_id}/activity", response_model=List[CustomerActivityLogRead])
def list_activity_logs(
    customer_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    return CustomersService(db).repo.list_activity_logs(customer_id, limit=limit)
