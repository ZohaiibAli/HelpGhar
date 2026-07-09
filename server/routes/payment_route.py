from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection, payment_collection
from model.payment_model import PaymentCreate
from helper.auth_helper import get_current_customer
from helper.id_helper import generate_transaction_id
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["Payments"])

DUMMY_CARD_HOLDER = "Demo Account Holder"
DUMMY_CARD_MASKED = "**** **** **** 4242"

METHOD_LABELS = {"card": "Card", "wallet": "Wallet", "bank": "Bank"}


@router.post("/")
def make_payment(
    payment: PaymentCreate,
    current_customer: dict = Depends(get_current_customer)
):
    booking = booking_collection.find_one({
        "id": payment.bookingId,
        "customerId": current_customer["customerId"]
    })
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == "confirmed":
        raise HTTPException(status_code=400, detail="Booking already paid")

    transaction_id = generate_transaction_id()

    payment_data = {
        "id": transaction_id,
        "bookingId": payment.bookingId,
        "customerId": current_customer["customerId"],
        "method": METHOD_LABELS.get(payment.method, payment.method),
        "amount": booking["amount"],
        "platformFee": booking["platformFee"],
        "total": booking["total"],
        "cardHolder": DUMMY_CARD_HOLDER,
        "cardNumberMasked": DUMMY_CARD_MASKED,
        "date": datetime.utcnow().isoformat(),
        "status": "successful",
    }

    payment_collection.insert_one(payment_data)
    booking_collection.update_one(
        {"id": payment.bookingId},
        {"$set": {"status": "confirmed"}}
    )

    payment_data.pop("_id", None)
    return {"success": True, "message": "Payment successful", "payment": payment_data}


@router.get("/receipt/{transaction_id}")
def get_receipt(transaction_id: str, current_customer: dict = Depends(get_current_customer)):
    payment = payment_collection.find_one({
        "id": transaction_id,
        "customerId": current_customer["customerId"]
    })
    if not payment:
        raise HTTPException(status_code=404, detail="Receipt not found")

    del payment["_id"]
    return {"success": True, "receipt": payment}