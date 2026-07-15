from pydantic import BaseModel

class ReviewCreate(BaseModel):
    workerId: str
    customerId: str
    customerName: str
    rating: int
    comment: str
    date: str