from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from config.db import (
    booking_collection,
    dispute_collection,
    payment_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import PaymentDisputeCreate, WorkerDisputeCreate
from helper.escrow_helper import ESCROW_BOOKING_STATUSES
from helper.payment_dispute_helper import PAYMENT_DISPUTE, open_payment_dispute
from helper.email_helper import (
    payment_dispute_opened_customer_email,
    payment_dispute_received_email,
)
from helper.auth_helper import get_current_worker
from helper.id_helper import generate_worker_dispute_id
from datetime import datetime
from helper.dispute_helper import booked_counterparts
from helper.price_helper import worker_payout
from helper.email_helper import send_plain_email, complaint_received_email

router = APIRouter(
    prefix="/worker",
    tags=["Worker Disputes"]
)


@router.post("/dispute")
def create_worker_dispute(
    dispute: WorkerDisputeCreate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_worker)
):

    # Must be a real booking this worker actually had with this
    # customer -- otherwise any authenticated worker could file a
    # dispute against any customer with no prior interaction at all.
    booking = booking_collection.find_one({
        "bookingId": dispute.bookingId,
        "workerId": user["workerId"],
        "customerId": dispute.customerId,
    })

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="No booking found between you and this customer."
        )

    customer = customer_collection.find_one(
        {
            "customerId": dispute.customerId
        }
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found"
        )

    worker = worker_collection.find_one(
        {
            "workerId": user["workerId"]
        }
    )

    dispute_id = generate_worker_dispute_id()

    dispute_collection.insert_one({

        "disputeId": dispute_id,

        "bookingId": booking["bookingId"],

        "workerId": user["workerId"],

        "workerName": worker.get("fullName", "Worker") if worker else "Worker",

        "customerId": customer["customerId"],

        "customerName": customer["fullName"],

        "subject": dispute.subject,

        "description": dispute.description,

        "status": "Open",

        "filedBy": "worker",

        "createdAt": datetime.utcnow()

    })

    if worker and worker.get("email"):
        background_tasks.add_task(
            send_plain_email,
            worker["email"],
            *complaint_received_email(
                worker.get("fullName"), dispute_id, dispute.subject,
                customer["fullName"], booking["bookingId"],
            ),
        )

    return {
        "success": True,
        "message": f"Complaint {dispute_id} submitted. We've emailed you a confirmation.",
        "disputeId": dispute_id,
    }


@router.post("/payment-dispute")
def create_payment_dispute(
    payload: PaymentDisputeCreate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_worker)
):
    """
    The job is done but the customer won't share the completion PIN. The
    held payment stays in escrow until an admin releases it to the worker
    or refunds the customer.
    """

    booking = booking_collection.find_one({
        "bookingId": payload.bookingId,
        "workerId": user["workerId"],
    })

    if booking is None:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.get("status") not in ESCROW_BOOKING_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="A payment dispute can only be raised on a paid booking that isn't completed yet."
        )

    if not payment_collection.find_one({"bookingId": booking["bookingId"], "status": "held"}):
        raise HTTPException(status_code=400, detail="There is no payment held for this booking.")

    # The job can't be "done" before its date.
    today = datetime.utcnow().date().isoformat()
    if (booking.get("date") or "") > today:
        raise HTTPException(
            status_code=400,
            detail=f"You can raise a payment dispute once the job date ({booking.get('date')}) has arrived."
        )

    existing = open_payment_dispute(booking)
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"Payment dispute {existing['disputeId']} is already open for this booking."
        )

    worker = worker_collection.find_one({"workerId": user["workerId"]}) or {}
    customer = customer_collection.find_one({"customerId": booking.get("customerId")}) or {}

    dispute_id = generate_worker_dispute_id()

    dispute_collection.insert_one({
        "disputeId": dispute_id,
        "type": PAYMENT_DISPUTE,
        "bookingId": booking["bookingId"],
        "workerId": user["workerId"],
        "workerName": worker.get("fullName", "Worker"),
        "customerId": booking.get("customerId"),
        "customerName": customer.get("fullName") or booking.get("customerName", "Customer"),
        "subject": "Payment dispute: completion PIN not given",
        "description": payload.description.strip(),
        "amount": worker_payout(booking),
        "status": "Open",
        "filedBy": "worker",
        "createdAt": datetime.utcnow(),
    })

    booking_collection.update_one(
        {"bookingId": booking["bookingId"]},
        {
            "$set": {"paymentDisputeId": dispute_id},
            "$unset": {"paymentDisputeOutcome": ""},
        },
    )

    if worker.get("email"):
        background_tasks.add_task(
            send_plain_email,
            worker["email"],
            *payment_dispute_received_email(
                worker.get("fullName"), dispute_id, booking["bookingId"],
                customer.get("fullName") or "the customer", worker_payout(booking),
            ),
        )

    if customer.get("email"):
        background_tasks.add_task(
            send_plain_email,
            customer["email"],
            *payment_dispute_opened_customer_email(
                customer.get("fullName"), dispute_id, booking["bookingId"],
                worker.get("fullName") or "Your worker",
            ),
        )

    return {
        "success": True,
        "message": f"Payment dispute {dispute_id} submitted. HelpGhar will review it and email you the decision.",
        "disputeId": dispute_id,
    }


@router.get("/disputes")
def get_worker_disputes(user=Depends(get_current_worker)):

    disputes = dispute_collection.find(
        {
            "workerId": user["workerId"],
            "filedBy": "worker"
        }
    )

    result = []

    for dispute in disputes:

        result.append({

            "id": dispute["disputeId"],

            "customerId": dispute["customerId"],

            "customerName": dispute["customerName"],

            "bookingId": dispute.get("bookingId"),

            "subject": dispute["subject"],

            "description": dispute["description"],

            "status": dispute["status"].lower(),

            "actionTaken": bool(dispute.get("actionTaken")),

            "type": dispute.get("type", "complaint"),

            "amount": dispute.get("amount"),

            "resolution": (dispute.get("resolution") or {}).get("decision"),

            "createdAt": dispute["createdAt"]

        })

    return {

        "success": True,

        "complaints": result

    }


@router.get("/customers")
def get_customers(user=Depends(get_current_worker)):
    """
    Only customers who have booked this worker, most recent. This
    endpoint used to need no login at all and returned the name of every
    customer on the platform.
    """

    return {
        "success": True,
        "customers": booked_counterparts("worker", user["workerId"]),
    }
