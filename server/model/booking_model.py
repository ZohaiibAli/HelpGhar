from pydantic import BaseModel, Field
from typing import Optional

class BookingCreate(BaseModel):
    workerId: str
    workerName: str
    workerAvatar: Optional[str] = None
    category: str
    date: str
    timeSlot: str
    # Bounded to a sane range -- this feeds directly into the
    # server-side price calculation in booking_route.py, so an
    # unbounded value could be used to inflate/underflow the charge.
    durationHours: int = Field(ge=1, le=24)
    address: str

class BookingReschedule(BaseModel):
    date: str
    timeSlot: str
