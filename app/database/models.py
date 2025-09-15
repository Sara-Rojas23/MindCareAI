from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmotionEntry(BaseModel):
    id: Optional[int]
    user_id: int
    text: str
    detected_emotion: str
    confidence: float
    analysis_method: str
    raw_scores: Optional[str]
    processed_text: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

class User(BaseModel):
    id: Optional[int]
    name: str
    email: Optional[str]
    created_at: Optional[datetime]
