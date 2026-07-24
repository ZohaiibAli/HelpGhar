from fastapi import APIRouter, Depends, HTTPException
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

router = APIRouter(
    prefix="/customer",
    tags=["Customer Disputes"]
)


@router.post("/dispute")
def create_dispute(
    dispute: DisputeCreate,
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

    dispute_collection.insert_one({
        "disputeId": generate_customer_dispute_id(),
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

    return {
        "success": True,
        "message": "Dispute Submitted Successfully"
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
            "subject": dispute["subject"],
            "description": dispute["description"],
            "status": dispute["status"].lower(),
            "createdAt": dispute["createdAt"]
        })

    return {
        "success": True,
        "complaints": result
    }


@router.get("/workers")
def get_workers():

    workers = worker_collection.find()

    result = []

    for worker in workers:

        result.append({
            "workerId": worker["workerId"],
            "fullName": worker["fullName"]
        })

    return {
        "success": True,
        "workers": result
    }
