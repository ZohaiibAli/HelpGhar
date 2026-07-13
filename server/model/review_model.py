from pydantic import BaseModel

class ReviewCreate(BaseModel):
    workerId: str
    rating: int
    comment: str