from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(
    prefix="/worker",
    tags=["Worker Disputes"]
)


@router.post("/dispute")
def create_worker_dispute(
    dispute: WorkerDisputeCreate,
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

    dispute_collection.insert_one({

        "disputeId": generate_worker_dispute_id(),

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

    return {

        "success": True,

        "message": "Dispute Submitted Successfully"

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

            "subject": dispute["subject"],

            "description": dispute["description"],

            "status": dispute["status"].lower(),

            "createdAt": dispute["createdAt"]

        })

    return {

        "success": True,

        "complaints": result

    }


@router.get("/customers")
def get_customers():

    customers = customer_collection.find()

    result = []

    for customer in customers:

        result.append({

            "customerId": customer["customerId"],

            "fullName": customer["fullName"]

        })

    return {

        "success": True,

        "customers": result

    }
