from pydantic import BaseModel, EmailStr

class CustomerRegister(BaseModel):

    fullName:str
    email:EmailStr
    phone:str
    address:str
    password:str