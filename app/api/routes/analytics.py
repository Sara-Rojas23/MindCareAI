from fastapi import APIRouter, Depends, Query
from app.api.dependencies import get_current_user
from app.database.connection import SessionLocal
from app.database.schemas import EmotionEntryDB
from sqlalchemy.orm import Session
from typing import Dict, Any
from datetime import datetime, timedelta

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/stats")
def get_stats(
    user_id: int = Query(1),
    period: str = Query("30days"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    # Calcular rango de fechas
    now = datetime.utcnow()
    if period.endswith("days"):
        days = int(period.replace("days", ""))
        since = now - timedelta(days=days)
    else:
        since = now - timedelta(days=30)
    # Query
    entries = db.query(EmotionEntryDB).filter(
        EmotionEntryDB.user_id == user_id,
        EmotionEntryDB.created_at >= since
    ).all()
    total_entries = len(entries)
    emotions_distribution = {}
    trends = {}
    # Conteo por emoción
    for e in entries:
        emotions_distribution[e.detected_emotion] = emotions_distribution.get(e.detected_emotion, 0) + 1
    # Tendencia simple: conteo por día
    for e in entries:
        day = e.created_at.strftime("%Y-%m-%d") if e.created_at else "unknown"
        if day not in trends:
            trends[day] = {}
        trends[day][e.detected_emotion] = trends[day].get(e.detected_emotion, 0) + 1
    return {
        "total_entries": total_entries,
        "emotions_distribution": emotions_distribution,
        "trends": trends
    }
