from pydantic import BaseModel, EmailStr

class CustomerRegister(BaseModel):

    fullName:str
    email:EmailStr
    phone:str
    address:str
    password:str

class CustomerLogin(BaseModel):
    email: EmailStr
    password: str

class CustomerUpdate(BaseModel):

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