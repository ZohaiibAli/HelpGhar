from fastapi import APIRouter, Depends, HTTPException
from config.db import booking_collection, payment_collection, payment_card_collection
from model.payment_model import PaymentCreate
from helper.auth_helper import get_current_customer
from helper.id_helper import generate_transaction_id
from datetime import datetime

router = APIRouter(prefix="/payments", tags=["Payments"])

METHOD_LABELS = {"card": "Card", "wallet": "Wallet", "bank": "Bank"}


@router.post("/")
def make_payment(
    payment: PaymentCreate,
    current_customer: dict = Depends(get_current_customer)
):
    # print("Received bookingId:", payment.bookingId)
    # print("Customer:", current_customer["customerId"])
    
    booking = booking_collection.find_one({
    "bookingId": payment.bookingId,
    "customerId": current_customer["customerId"]
})

    # print("Booking found:", booking)

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["status"] == "confirmed":
        raise HTTPException(status_code=400, detail="Booking already paid")

    card = payment_card_collection.find_one({"cardId": "CARD-DEFAULT"})
    if not card:
        raise HTTPException(status_code=500, detail="Default payment card not configured")

    if payment.method == "card":
        typed_holder = (payment.cardHolder or "").strip().lower()
        typed_number = (payment.cardNumber or "").strip()
        typed_expiry = (payment.expiry or "").strip()
        typed_cvv = (payment.cvv or "").strip()

        if (
            typed_holder != card["cardHolder"].strip().lower()
            or typed_number != card["cardNumber"].strip()
            or typed_expiry != card["expiry"].strip()
            or typed_cvv != card["cvv"].strip()
        ):
            raise HTTPException(status_code=400, detail="Invalid card details. Please check and try again.")

    transaction_id = generate_transaction_id()

    payment_data = {
        "id": transaction_id,
        "bookingId": payment.bookingId,
        "customerId": current_customer["customerId"],
        "method": METHOD_LABELS.get(payment.method, payment.method),
        "amount": booking["amount"],
        "platformFee": booking["platformFee"],
        "total": booking["total"],
        "cardHolder": card["cardHolder"],
        "cardNumber": card["cardNumber"],
        "expiry": card["expiry"],
        "date": datetime.utcnow().isoformat(),
        "status": "successful",
    }

    payment_collection.insert_one(payment_data)
    booking_collection.update_one(
        {"bookingId": payment.bookingId},
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

@router.get("/my")
def get_my_transactions(
    current_customer: dict = Depends(get_current_customer)
):

    payments = list(
        payment_collection.find(
            {
                "customerId": current_customer["customerId"]
            }
        ).sort("date", -1)
    )

    for payment in payments:
        payment["_id"] = str(payment["_id"])

    return {
        "success": True,
        "transactions": payments
    }