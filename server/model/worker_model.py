from pydantic import BaseModel, EmailStr, Field
from typing import List, Literal, Optional

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
    # Ignored if sent: a gig is always for the service the worker registered
    # under, and the server copies it from the worker record.
    category: Optional[str] = None
    city: str
    gender: str
    age: int
    experienceYears: int
    memberSince: str
    # One flat rate per unit -- the booking duration is picked in the same
    # unit, so a monthly gig is booked by months and an hourly one by hours.
    price: int = Field(gt=0, le=10_000_000)
    priceUnit: Literal["hour", "day", "month"]
    available: bool = True
    # rating, reviewsCount, cnicVerified and badges are deliberately NOT
    # accepted here. They are reputation, not listing content, and a worker
    # was previously able to submit them with their own gig -- posting
    # cnicVerified: true awarded the CNIC badge with no admin ever seeing
    # the account, and rating: 5.0 / badges: ["Top Rated"] wrote a
    # reputation nobody had earned. All four are now owned by the server:
    # rating and reviewsCount come from review_ranking_service, badges from
    # the reputation pass, and cnicVerified from the admin's approval.
    bio: str = ""
    skills: List[str] = []
    certificates: List[str] = []

class WorkerDetailsUpdate(BaseModel):
    about: str
    skills: str
    certifications: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    password: str