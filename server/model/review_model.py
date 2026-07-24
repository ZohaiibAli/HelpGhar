from pydantic import BaseModel, Field

class ReviewCreate(BaseModel):
    workerId: str
    rating: int = Field(ge=1, le=5)
    comment: str