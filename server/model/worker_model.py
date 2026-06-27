from pydantic import BaseModel, EmailStr

class WorkerRegister(BaseModel):

    fullName:str
    email:EmailStr
    phone:str
    address:str
    password:str

    cnic:str
    dob:str
    gender:str
    category:str
    experience:str
    pricing:str
    skills:str