from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from config.db import admin_collection
from helper.account_helper import ROLE_COLLECTION, ROLE_ID_FIELD, block_message, refresh
from bson import ObjectId
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

security = HTTPBearer()


def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        #print("Decoded Payload:", payload)   # <-- ADD THIS

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or Expired Token"
        )

    _ensure_account_usable(payload)

    return payload


def _ensure_account_usable(payload: dict):
    """
    A token stays valid for 24h, so suspending/blocking an account must
    also stop the sessions it already has -- checking only at login let a
    suspended user carry on as normal until their token expired.
    """

    role = payload.get("role")
    if role not in ROLE_ID_FIELD:
        return

    user_code = payload.get(ROLE_ID_FIELD[role])
    user = ROLE_COLLECTION[role].find_one({ROLE_ID_FIELD[role]: user_code})

    if not user:
        raise HTTPException(status_code=401, detail="Account not found")

    message = block_message(refresh(role, user))

    if message:
        raise HTTPException(status_code=403, detail=message)
    
def get_current_customer(payload: dict = Depends(verify_token)):
    if payload.get("role") != "customer":
        raise HTTPException(
            status_code=403,
            detail="Only customers can perform this action"
        )
    return payload

def get_current_worker(payload: dict = Depends(verify_token)):
    if payload.get("role") != "worker":
        raise HTTPException(
            status_code=403,
            detail="Only workers can perform this action"
        )

    return payload
    


def get_current_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can perform this action"
        )

    admin = admin_collection.find_one(
        {"_id": ObjectId(payload["id"])}
    )

    if not admin:
        raise HTTPException(
            status_code=404,
            detail="Admin not found"
        )

    return admin