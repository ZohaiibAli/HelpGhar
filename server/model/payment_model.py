from pydantic import BaseModel
from typing import Optional

class PaymentCreate(BaseModel):
    bookingId: str
    method: str
    cardHolder: Optional[str] = None
    cardNumber: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None