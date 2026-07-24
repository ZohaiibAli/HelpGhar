from pydantic import BaseModel

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