from pydantic import BaseModel, EmailStr

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