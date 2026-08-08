from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo.errors import DuplicateKeyError
from datetime import datetime

from config.db import (
    job_post_collection,
    job_application_collection,
    worker_collection,
    customer_collection,
    booking_collection,
)
from model.job_model import JobPostCreate, JobApplicationCreate
from helper.auth_helper import get_current_customer, get_current_worker
from helper.id_helper import generate_job_id, generate_job_application_id, generate_booking_id

router = APIRouter(prefix="/jobs", tags=["Jobs"])

PLATFORM_FEE_RATE = 0.05


def _applications_count_by_job(job_ids: list[str]) -> dict:
    if not job_ids:
        return {}
    counts = job_application_collection.aggregate([
        {"$match": {"jobId": {"$in": job_ids}}},
        {"$group": {"_id": "$jobId", "count": {"$sum": 1}}},
    ])
    return {row["_id"]: row["count"] for row in counts}


@router.post("/")
def create_job_post(
    job: JobPostCreate,
    current_customer: dict = Depends(get_current_customer)
):
    customer_record = customer_collection.find_one({"customerId": current_customer["customerId"]})

    job_data = job.dict()
    job_data["jobId"] = generate_job_id()
    job_data["customerId"] = current_customer["customerId"]
    job_data["customerName"] = customer_record.get("fullName") if customer_record else "Customer"
    job_data["customerPhone"] = customer_record.get("phone") if customer_record else ""
    job_data["status"] = "open"
    job_data["createdAt"] = datetime.utcnow().isoformat()

    job_post_collection.insert_one(job_data)

    return {
        "success": True,
        "message": "Job posted successfully",
        "jobId": job_data["jobId"]
    }


@router.get("/my")
def get_my_job_posts(current_customer: dict = Depends(get_current_customer)):
    jobs = list(
        job_post_collection.find({"customerId": current_customer["customerId"]}).sort("createdAt", -1)
    )

    counts = _applications_count_by_job([j["jobId"] for j in jobs])

    for job in jobs:
        del job["_id"]
        job["applicationsCount"] = counts.get(job["jobId"], 0)

    return {"success": True, "jobs": jobs}


@router.get("/open")
def get_open_jobs(
    category: str | None = Query(default=None),
    current_worker: dict = Depends(get_current_worker)
):
    query = {"status": "open"}
    if category:
        query["category"] = category

    jobs = list(job_post_collection.find(query).sort("createdAt", -1))

    applied_job_ids = {
        app["jobId"]
        for app in job_application_collection.find(
            {"workerId": current_worker["workerId"], "jobId": {"$in": [j["jobId"] for j in jobs]}},
            {"jobId": 1}
        )
    }

    for job in jobs:
        del job["_id"]
        job["alreadyApplied"] = job["jobId"] in applied_job_ids

    return {"success": True, "jobs": jobs}


@router.get("/worker/my-applications")
def get_my_applications(current_worker: dict = Depends(get_current_worker)):
    applications = list(
        job_application_collection.find({"workerId": current_worker["workerId"]}).sort("createdAt", -1)
    )

    jobs_by_id = {
        job["jobId"]: job
        for job in job_post_collection.find(
            {"jobId": {"$in": [a["jobId"] for a in applications]}}
        )
    }

    for app in applications:
        del app["_id"]
        job = jobs_by_id.get(app["jobId"]) or {}
        app["jobTitle"] = job.get("title", "")
        app["jobCategory"] = job.get("category", "")
        app["jobStatus"] = job.get("status", "")

    return {"success": True, "applications": applications}


@router.get("/{job_id}")
def get_job_post(job_id: str, current_customer: dict = Depends(get_current_customer)):
    job = job_post_collection.find_one({"jobId": job_id, "customerId": current_customer["customerId"]})

    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    del job["_id"]
    return {"success": True, "job": job}


@router.get("/{job_id}/applications")
def get_job_applications(job_id: str, current_customer: dict = Depends(get_current_customer)):
    job = job_post_collection.find_one({"jobId": job_id, "customerId": current_customer["customerId"]})

    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    del job["_id"]

    applications = list(job_application_collection.find({"jobId": job_id}).sort("createdAt", -1))

    worker_ids = {app["workerId"] for app in applications}
    workers_by_id = {
        worker["workerId"]: worker
        for worker in worker_collection.find({"workerId": {"$in": list(worker_ids)}})
    }

    for app in applications:
        del app["_id"]
        worker = workers_by_id.get(app["workerId"]) or {}
        app["rating"] = worker.get("rating", 0)
        app["reviewsCount"] = worker.get("reviewsCount", 0)
        app["cnicVerified"] = worker.get("verificationStatus") == "approved"

    return {"success": True, "job": job, "applications": applications}


@router.post("/{job_id}/apply")
def apply_to_job(
    job_id: str,
    application: JobApplicationCreate,
    current_worker: dict = Depends(get_current_worker)
):
    job = job_post_collection.find_one({"jobId": job_id, "status": "open"})

    if not job:
        raise HTTPException(
            status_code=404,
            detail="This job is no longer open for applications."
        )

    worker = worker_collection.find_one({"workerId": current_worker["workerId"]})

    application_data = application.dict()
    application_data["applicationId"] = generate_job_application_id()
    application_data["jobId"] = job_id
    application_data["workerId"] = current_worker["workerId"]
    application_data["workerName"] = worker.get("fullName") if worker else ""
    application_data["workerAvatar"] = worker.get("profileImage") if worker else None
    application_data["status"] = "pending"
    application_data["createdAt"] = datetime.utcnow().isoformat()

    try:
        job_application_collection.insert_one(application_data)
    except DuplicateKeyError:
        # The pre-check above can't stop two concurrent "Apply" clicks --
        # the unique (jobId, workerId) index in config/db.py is what
        # actually closes that race.
        raise HTTPException(status_code=409, detail="You have already applied to this job.")

    return {
        "success": True,
        "message": "Application submitted",
        "applicationId": application_data["applicationId"]
    }


@router.patch("/{job_id}/cancel")
def cancel_job_post(job_id: str, current_customer: dict = Depends(get_current_customer)):
    job = job_post_collection.find_one({"jobId": job_id, "customerId": current_customer["customerId"]})

    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="Only an open job post can be cancelled")

    job_post_collection.update_one({"jobId": job_id}, {"$set": {"status": "cancelled"}})

    return {"success": True, "message": "Job post cancelled"}


@router.patch("/{job_id}/applications/{application_id}/accept")
def accept_application(
    job_id: str,
    application_id: str,
    current_customer: dict = Depends(get_current_customer)
):
    job = job_post_collection.find_one({"jobId": job_id, "customerId": current_customer["customerId"]})

    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="This job post is no longer open")

    application = job_application_collection.find_one({"applicationId": application_id, "jobId": job_id})

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application["status"] != "pending":
        raise HTTPException(status_code=400, detail="This application has already been decided")

    worker = worker_collection.find_one({"workerId": application["workerId"]})

    if not worker:
        raise HTTPException(status_code=404, detail="This worker is no longer available")

    # The agreed amount comes straight from the application the customer is
    # explicitly accepting here -- it was the worker's own proposal, never a
    # client-supplied number at this call, so it's safe to use as the
    # booking's price (same trust boundary as _price_booking in
    # booking_route.py, just sourced from a proposal instead of a gig).
    amount = application["proposedPrice"]
    platform_fee = round(amount * PLATFORM_FEE_RATE)
    total = amount + platform_fee

    customer_record = customer_collection.find_one({"customerId": current_customer["customerId"]})

    booking_data = {
        "bookingId": generate_booking_id(),
        "workerId": application["workerId"],
        "workerName": worker.get("fullName", application.get("workerName", "")),
        "workerAvatar": worker.get("profileImage"),
        "category": job["category"],
        "date": job["preferredDate"],
        "timeSlot": job["preferredTime"],
        # Informational only -- the price here is the agreed total for the
        # whole job, not an hourly rate multiplied by duration.
        "durationHours": 1,
        "address": job["address"],
        "amount": amount,
        "platformFee": platform_fee,
        "total": total,
        "status": "pending",
        "customerId": current_customer["customerId"],
        "customerName": customer_record.get("fullName") if customer_record else "Customer",
        "customerPhone": customer_record.get("phone") if customer_record else "",
        "createdAt": datetime.utcnow().isoformat(),
        "jobId": job_id,
        "applicationId": application_id,
        "source": "job_post",
    }

    booking_collection.insert_one(booking_data)

    job_application_collection.update_one(
        {"applicationId": application_id},
        {"$set": {"status": "accepted"}}
    )

    job_application_collection.update_many(
        {"jobId": job_id, "applicationId": {"$ne": application_id}, "status": "pending"},
        {"$set": {"status": "rejected"}}
    )

    job_post_collection.update_one({"jobId": job_id}, {"$set": {"status": "assigned"}})

    return {
        "success": True,
        "message": "Application accepted",
        "bookingId": booking_data["bookingId"]
    }


@router.patch("/{job_id}/applications/{application_id}/reject")
def reject_application(
    job_id: str,
    application_id: str,
    current_customer: dict = Depends(get_current_customer)
):
    job = job_post_collection.find_one({"jobId": job_id, "customerId": current_customer["customerId"]})

    if not job:
        raise HTTPException(status_code=404, detail="Job post not found")

    application = job_application_collection.find_one({"applicationId": application_id, "jobId": job_id})

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application["status"] != "pending":
        raise HTTPException(status_code=400, detail="This application has already been decided")

    job_application_collection.update_one(
        {"applicationId": application_id},
        {"$set": {"status": "rejected"}}
    )

    return {"success": True, "message": "Application rejected"}


@router.patch("/{job_id}/applications/{application_id}/withdraw")
def withdraw_application(
    job_id: str,
    application_id: str,
    current_worker: dict = Depends(get_current_worker)
):
    application = job_application_collection.find_one({
        "applicationId": application_id,
        "jobId": job_id,
        "workerId": current_worker["workerId"]
    })

    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    if application["status"] != "pending":
        raise HTTPException(status_code=400, detail="Only a pending application can be withdrawn")

    job_application_collection.update_one(
        {"applicationId": application_id},
        {"$set": {"status": "withdrawn"}}
    )

    return {"success": True, "message": "Application withdrawn"}
