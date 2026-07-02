from pydantic import BaseModel

class DisputeCreate(BaseModel):
    workerId: str
    subject: str
    description: str

class WorkerDisputeCreate(BaseModel):
    customerId: str
    subject: str
    description: str