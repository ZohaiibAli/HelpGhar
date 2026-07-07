from pydantic import BaseModel, EmailStr
from typing import List, Optional

class WorkerRegister(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    address: str
    password: str
    cnic: str
    dob: str
    gender: str
    category: str
    experience: str
    pricing: str
    skills: str

class WorkerLogin(BaseModel):
    email: EmailStr
    password: str
    
class WorkerUpdate(BaseModel):
    fullName: str
    email: EmailStr
    phone: str
    address: str
    cnic: str
    dob: str
    gender: str
    category: str
    experience: str
    pricing: str
    skills: str

class WorkerPasswordUpdate(BaseModel):
    currentPassword: str
    newPassword: str
    
# 👇 new
class GigCreate(BaseModel):
    fullName: str
    avatar: str
    category: str
    city: str
    gender: str
    age: int
    experienceYears: int
    memberSince: str
    priceMin: int
    priceMax: int
    priceUnit: str
    rating: float = 0
    reviewsCount: int = 0
    available: bool = True
    cnicVerified: bool = False
    badges: List[str] = []
    bio: str = ""
    skills: List[str] = []
    certificates: List[str] = []

class WorkerDetailsUpdate(BaseModel):
    about: str
    skills: str
    certifications: str