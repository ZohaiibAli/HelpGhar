from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from config.db import (
    booking_collection,
    dispute_collection,
    worker_collection,
    customer_collection
)
from model.dispute_model import WorkerDisputeCreate
from helper.auth_helper import get_current_worker
from helper.id_helper import generate_worker_dispute_id
from datetime import datetime
from helper.dispute_helper import booked_counterparts
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
