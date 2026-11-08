from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from config.db import (
    booking_collection,
    dispute_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import DisputeCreate
from helper.auth_helper import get_current_customer
from helper.id_helper import generate_customer_dispute_id
from datetime import datetime
from helper.dispute_helper import booked_counterparts
from helper.email_helper import send_plain_email, complaint_received_email

router = APIRouter(
    prefix="/customer",
    tags=["Customer Disputes"]
)


@router.post("/dispute")
def create_dispute(
    dispute: DisputeCreate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_customer)
):

    # Must be a real booking this customer actually had with this
    # worker -- otherwise any authenticated customer could file a
    # dispute against any worker with no prior interaction at all.
    booking = booking_collection.find_one({
        "bookingId": dispute.bookingId,
        "customerId": user["customerId"],
        "workerId": dispute.workerId,
    })

    if booking is None:
        raise HTTPException(
            status_code=404,
            detail="No booking found between you and this worker."
        )

    worker = worker_collection.find_one(
        {
            "workerId": dispute.workerId
        }
    )

    if worker is None:
        raise HTTPException(
            status_code=404,
            detail="Worker not found"
        )

    customer = customer_collection.find_one(
        {
            "customerId": user["customerId"]
        }
    )

    dispute_id = generate_customer_dispute_id()

    dispute_collection.insert_one({
        "disputeId": dispute_id,
        "bookingId": booking["bookingId"],
        "customerId": user["customerId"],
        "customerName": customer.get("fullName", "Customer") if customer else "Customer",
        "workerId": worker["workerId"],
        "workerName": worker["fullName"],
        "subject": dispute.subject,
        "description": dispute.description,
        "status": "Open",
        "filedBy": "customer",
        "createdAt": datetime.utcnow()
    })

    if customer and customer.get("email"):
        background_tasks.add_task(
            send_plain_email,
            customer["email"],
            *complaint_received_email(
                customer.get("fullName"), dispute_id, dispute.subject,
                worker["fullName"], booking["bookingId"],
            ),
        )

    return {
        "success": True,
        "message": f"Complaint {dispute_id} submitted. We've emailed you a confirmation.",
        "disputeId": dispute_id,
    }


@router.get("/disputes")
def get_customer_disputes(user=Depends(get_current_customer)):

    disputes = dispute_collection.find(
        {
            "customerId": user["customerId"]
        }
    )

    result = []

    for dispute in disputes:

        result.append({
            "id": dispute["disputeId"],
            "workerId": dispute["workerId"],
            "workerName": dispute["workerName"],
            "bookingId": dispute.get("bookingId"),
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "actionTaken": bool(dispute.get("actionTaken")),
            "createdAt": dispute["createdAt"]
        })

    return {
        "success": True,
        "complaints": result
    }


@router.get("/workers")
def get_workers(user=Depends(get_current_customer)):
    """Only workers this customer has booked, most recent first."""

    return {
        "success": True,
        "workers": booked_counterparts("customer", user["customerId"]),
    }
