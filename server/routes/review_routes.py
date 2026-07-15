from fastapi import APIRouter
from config.db import review_collection
from model.review_model import ReviewCreate
from bson import ObjectId

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.post("")
def create_review(review: ReviewCreate):

    data = review.dict()

    result = review_collection.insert_one(data)

    data["id"] = str(result.inserted_id)

    return data


@router.get("")
def get_reviews(workerId: str | None = None):

    query = {}

    if workerId:
        query["workerId"] = workerId

    reviews = []

    for review in review_collection.find(query):

        review["id"] = str(review["_id"])
        del review["_id"]

        reviews.append(review)

    return reviews