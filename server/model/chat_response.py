from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class ChatResponse(BaseModel):

    success: bool

    intent: str

    message: str

    workers_found: int = 0

    workers: List[Dict[str, Any]] = []

    sources: List[str] = []