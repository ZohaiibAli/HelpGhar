from fastapi import APIRouter, Depends

from helper.auth_helper import get_current_customer

from config.db import worker_collection

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

    workers = list(
        worker_collection.find(
            {
                "status":"Active"
            }
        )
    )

    ranked = recommendation_service.recommend_workers(
        customer["customerId"],
        workers
    )

    return {

        "success":True,

        "workers":ranked
    }