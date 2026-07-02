from pydantic import BaseModel

class DisputeCreate(BaseModel):
    workerName: str
    subject: str
    description: str