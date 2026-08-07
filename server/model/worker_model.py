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