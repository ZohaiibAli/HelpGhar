from jose import JWTError, jwt
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
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

        return payload

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or Expired Token"
        )
    
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
def get_current_admin(payload: dict = Depends(verify_token)):
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admins can perform this action"
        )
    return payload