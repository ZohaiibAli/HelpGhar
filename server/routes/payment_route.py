from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from config.db import (
    booking_collection,
    customer_collection,
    payment_collection,
    payment_card_collection,
)
from model.payment_model import PaymentCreate
from helper.auth_helper import get_current_customer
from helper.id_helper import generate_transaction_id
from helper.escrow_helper import generate_pin
from helper.email_helper import send_completion_pin_email
from datetime import datetime
from zoneinfo import ZoneInfo

router = APIRouter(prefix="/payments", tags=["Payments"])

METHOD_LABELS = {"card": "Card", "wallet": "Wallet", "bank": "Bank"}


@router.post("/")
def make_payment(
    payment: PaymentCreate,
    background_tasks: BackgroundTasks,
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

    # "pending" is the only status that hasn't been paid for yet and
    # is still payable. The old check only rejected "confirmed" (i.e.
    # already paid), which let a *cancelled* or *completed* booking be
    # paid again -- inserting a duplicate payment record and silently
    # resurrecting a booking the customer or worker had cancelled.
    if booking["status"] != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"This booking cannot be paid for (status: {booking['status']})."
        )

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
    "customerName": booking.get("customerName", ""),

    "workerName": booking.get("workerName", ""),
    "workerId": booking.get("workerId", ""),

    "category": booking.get("category", ""),

    "method": METHOD_LABELS.get(payment.method, payment.method),

    "amount": booking.get("amount", 0),
    "platformFee": booking.get("platformFee", 0),
    "total": booking.get("total", 0),

    "date": datetime.now(ZoneInfo("Asia/Karachi")).isoformat(),

    # Escrow: HelpGhar holds the money until the worker completes the
    # job with the customer's PIN (see helper/escrow_helper.py).
    "status": "held",
}

    # Flip the booking first and only if it is still pending, so two
    # simultaneous pay clicks can't both charge the customer.
    pin = generate_pin()
    claimed = booking_collection.update_one(
        {"bookingId": payment.bookingId, "status": "pending"},
        {"$set": {"status": "confirmed", "completionPin": pin, "pinAttempts": 0}}
    )

    if claimed.modified_count == 0:
        raise HTTPException(status_code=400, detail="This booking has already been paid for.")

    payment_collection.insert_one(payment_data)

    customer = customer_collection.find_one({"customerId": current_customer["customerId"]})
    if customer and customer.get("email"):
        background_tasks.add_task(
            send_completion_pin_email,
            customer["email"],
            customer.get("fullName", "Customer"),
            payment.bookingId,
            booking.get("workerName", "your worker"),
            booking.get("category", ""),
            booking.get("date", ""),
            booking.get("timeSlot", ""),
            pin,
        )

    payment_data.pop("_id", None)
    return {
        "success": True,
        "message": "Payment successful",
        "payment": payment_data,
        "completionPin": pin,
    }

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