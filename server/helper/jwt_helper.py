from jose import jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

# Token lifetime is configured in one place only: ACCESS_TOKEN_EXPIRE_HOURS.
# The fallback is a normal production lifetime -- a short lifetime for testing
# expiry belongs in .env (gitignored), never in committed code.
DEFAULT_ACCESS_TOKEN_EXPIRE_HOURS = 24.0

try:
    ACCESS_TOKEN_EXPIRE_HOURS = float(
        os.getenv("ACCESS_TOKEN_EXPIRE_HOURS")
        or DEFAULT_ACCESS_TOKEN_EXPIRE_HOURS
    )
except ValueError:
    ACCESS_TOKEN_EXPIRE_HOURS = DEFAULT_ACCESS_TOKEN_EXPIRE_HOURS

print("ACCESS_TOKEN_EXPIRE_HOURS =", ACCESS_TOKEN_EXPIRE_HOURS)


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        hours=ACCESS_TOKEN_EXPIRE_HOURS
    )

    to_encode.update(
        {
            "exp": expire
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt