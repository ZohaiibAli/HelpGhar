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

    phone: str

    address: str