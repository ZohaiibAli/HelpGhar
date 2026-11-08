from typing import Literal, Optional

from pydantic import BaseModel, Field

class DisputeCreate(BaseModel):
    # Ties the dispute to a real booking the customer actually had
    # with this worker -- without this, any authenticated customer
    # could file a dispute against any worker with zero prior
    # interaction between them.
    bookingId: str
    workerId: str
    subject: str
    description: str

class WorkerDisputeCreate(BaseModel):
    bookingId: str
    customerId: str
    subject: str
    description: str


class PaymentDisputeCreate(BaseModel):
    # Worker: "I did the job but the customer won't give me the PIN."
    bookingId: str
    description: str = Field(min_length=10, max_length=1000)


class PaymentDisputeDecision(BaseModel):
    # Admin: release the held money to the worker, or refund the customer.
    decision: Literal["release", "refund"]
    note: Optional[str] = Field(default=None, max_length=500)