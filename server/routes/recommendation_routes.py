from fastapi import APIRouter, Depends

from helper.auth_helper import get_current_customer

from config.db import worker_collection

from config.db import gig_collection

from services.recommendation_service import (
    recommendation_service
)

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


@router.get("/my-workers")
def my_workers(
    customer=Depends(get_current_customer)
):

    workers = []

    for gig in gig_collection.find({"status": "Active"}):

        worker = worker_collection.find_one(
            {
                "workerId": gig["workerId"]
            }
        )

        if worker:

            gig["reviewSummary"] = worker.get("reviewSummary")
            gig["marketplaceScore"] = worker.get("marketplaceScore", 0)
            gig["reputationLabel"] = worker.get("reviewSummary", {}).get("label")
            gig["rating"] = worker.get("rating", gig.get("rating", 0))
            gig["reviewsCount"] = worker.get("reviewsCount", gig.get("reviewsCount", 0))
            gig["badges"] = worker.get("badges", [])

        workers.append(gig)


    ranked = recommendation_service.recommend_workers(
        customer["customerId"],
        workers
    )

    # for worker in ranked:

    #     worker["id"] = str(worker["_id"])

    #     del worker["_id"]

    return {
    "success": True,
    "workers": ranked
}