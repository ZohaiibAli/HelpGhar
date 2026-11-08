from pydantic import BaseModel, Field
from typing import Optional

class BookingCreate(BaseModel):
    workerId: str
    workerName: str
    workerAvatar: Optional[str] = None
    category: str
    date: str
    timeSlot: str
    # How many units of the gig's priceUnit (hours / days / months) are
    # being booked. The unit itself is taken from the gig server-side, and
    # the exact per-unit bound is enforced in booking_route.py -- this is
    # just the outer sanity limit since it feeds the price calculation.
    duration: int = Field(ge=1, le=30)
    address: str

class BookingReschedule(BaseModel):
    date: str
    timeSlot: str


class BookingComplete(BaseModel):
    # The 4-digit completion PIN the customer gives the worker once the
    # job is done. Kept as a string so leading zeros ("0042") survive.
    pin: str = Field(min_length=4, max_length=4, pattern=r"^\d{4}$")
