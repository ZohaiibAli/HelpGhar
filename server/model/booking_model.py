from pydantic import BaseModel
from typing import Optional

class BookingCreate(BaseModel):
    workerId: str
    workerName: str
    workerAvatar: Optional[str] = None
    category: str
    date: str
    timeSlot: str
    durationHours: int
    address: str
    amount: float
    platformFee: float
    total: float

