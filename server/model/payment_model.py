from pydantic import BaseModel

class PaymentCreate(BaseModel):
    bookingId: str
    method: str  # "card" | "wallet" | "bank"