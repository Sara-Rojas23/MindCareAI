from fastapi import APIRouter, Depends, Body, Query
from app.api.dependencies import get_current_user
from pydantic import BaseModel
from app.services.emotion_analyzer import EmotionAnalyzer
from app.database.connection import SessionLocal
from app.database.schemas import EmotionEntryDB
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
import json

router = APIRouter()

analyzer = EmotionAnalyzer()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class AnalyzeRequest(BaseModel):
    text: str
    user_id: int = 1

class AnalyzeResponse(BaseModel):
    emotion: str
    confidence: float
    id: int
    method: str
    raw_scores: Optional[List[Dict]] = None
    processed_text: Optional[str] = None

class HistoryEntry(BaseModel):
    id: int
    user_id: int
    text: str
    emotion: str
    confidence: float
    date: str

@router.post("/analyze", response_model=AnalyzeResponse)
def analyze_emotion(payload: AnalyzeRequest = Body(...), db: Session = Depends(get_db)):
    result = analyzer.analyze(payload.text)
    entry = EmotionEntryDB(
        user_id=payload.user_id,
        text=payload.text,
        detected_emotion=result["emotion"],
        confidence=result["confidence"],
        analysis_method=result["method"],
        raw_scores=json.dumps(result["raw_scores"]) if result["raw_scores"] else None,
        processed_text=result["processed_text"]
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return {
        "emotion": entry.detected_emotion,
        "confidence": entry.confidence,
        "id": entry.id,
        "method": entry.analysis_method,
        "raw_scores": result["raw_scores"],
        "processed_text": entry.processed_text
    }

@router.get("/history", response_model=List[HistoryEntry])
def get_history(
    user_id: int = Query(1),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    entries = db.query(EmotionEntryDB).filter(EmotionEntryDB.user_id == user_id)
    entries = entries.order_by(EmotionEntryDB.created_at.desc()).offset(offset).limit(limit).all()
    return [
        HistoryEntry(
            id=e.id,
            user_id=e.user_id,
            text=e.text,
            emotion=e.detected_emotion,
            confidence=e.confidence,
            date=e.created_at.isoformat() if e.created_at else None
        ) for e in entries
    ]

@router.get("/supported")
def get_supported_emotions():
    pass
