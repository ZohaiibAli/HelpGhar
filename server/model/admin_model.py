from pydantic import BaseModel, EmailStr
from typing import Literal

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

class WorkerVerification(BaseModel):
    action: Literal["approve", "reject"]