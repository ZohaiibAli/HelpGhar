import logging

from fastapi import APIRouter, Depends

from helper.auth_helper import get_current_customer

from config.db import gig_collection, worker_collection

from services.recommendation_service import (
    recommendation_service
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"]
)


def _enrich_with_worker_data(gigs):
    """
    Merges live reputation/marketplace data from the worker
    document onto each gig -- a gig's own copies of these fields
    can go stale between reviews.
    """

    worker_ids = list({
        gig["workerId"]
        for gig in gigs
        if gig.get("workerId")
    })

    workers_by_id = {}

    if worker_ids:
        for worker in worker_collection.find(
            {"workerId": {"$in": worker_ids}}
        ):
            workers_by_id[worker["workerId"]] = worker

    enriched = []

    for gig in gigs:

        worker = workers_by_id.get(gig.get("workerId"))

        if worker:

            gig["reviewSummary"] = worker.get("reviewSummary")
            gig["marketplaceScore"] = worker.get("marketplaceScore", 0)
            gig["reputationLabel"] = worker.get(
                "reputationLabel",
                gig.get("reputationLabel")
            )
            gig["rating"] = worker.get("rating", gig.get("rating", 0))
            gig["reviewsCount"] = worker.get(
                "reviewsCount",
                gig.get("reviewsCount", 0)
            )
            gig["badges"] = worker.get("badges", [])

        enriched.append(gig)

    return enriched


def _fallback_ranking(workers):
    """
    Popularity-based fallback used if the ML ranking pipeline
    fails for any reason -- customers should still see a
    reasonable worker list instead of an error page.
    """

    for worker in workers:

        if "_id" in worker:
            worker["id"] = str(worker["_id"])
            del worker["_id"]

    return sorted(
        workers,
        key=lambda worker: (
            worker.get("marketplaceScore", 0),
            worker.get("rating", 0)
        ),
        reverse=True
    )


@router.get("/my-workers")
def my_workers(
    customer=Depends(get_current_customer)
):

    gigs = list(gig_collection.find({"status": "Active"}))

    workers = _enrich_with_worker_data(gigs)

    try:

        ranked = recommendation_service.recommend_workers(
            customer["customerId"],
            workers
        )

    except Exception:

        logger.exception(
            "Recommendation ranking failed for customer %s, "
            "falling back to popularity ranking",
            customer.get("customerId")
        )

        ranked = _fallback_ranking(workers)

    return {
        "success": True,
        "workers": ranked
    }
