import os
from dotenv import load_dotenv

load_dotenv()

MODEL_NAME = os.getenv(
    "GEMINI_MODEL",
    "gemini-2.5-flash"
)