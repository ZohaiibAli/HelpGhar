from pydantic import BaseModel, EmailStr
from typing import Literal, Optional
from pydantic import Field

class AdminLogin(BaseModel):
    email: EmailStr
    password: str

class AdminUpdate(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    address: str

class ChangePassword(BaseModel):
    currentPassword: str
    newPassword: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    password: str
class WorkerVerification(BaseModel):
    action: Literal["approve", "reject"]


class ModerationAction(BaseModel):
    # suspend = temporary (days), block = until an admin restores,
    # restore = undo either one.
    action: Literal["suspend", "block", "restore"]
    days: Optional[Literal[3, 7, 30]] = None
    reason: Optional[str] = Field(default=None, max_length=500)
    # Set when the action is taken from a complaint, so the person who
    # filed it can be told action was taken.
    disputeId: Optional[str] = None
