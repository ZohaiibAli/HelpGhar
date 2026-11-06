from pydantic import BaseModel, Field


class JobPostCreate(BaseModel):
    category: str
    title: str
    description: str
    budgetMin: int = Field(ge=0)
    budgetMax: int = Field(ge=0)
    budgetUnit: str
    address: str
    preferredDate: str
    preferredTime: str


class JobApplicationCreate(BaseModel):
    message: str
    # Bounded below like BookingCreate.durationHours -- this becomes the
    # booking's amount verbatim if the customer accepts it, so it must at
    # least be a sane positive number.
    proposedPrice: int = Field(ge=1)
