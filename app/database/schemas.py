from sqlalchemy import Column, Integer, String, Float, Text, DateTime
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class EmotionEntryDB(Base):
    __tablename__ = "emotion_entries"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, default=1, nullable=False)
    text = Column(Text, nullable=False)
    detected_emotion = Column(String(50), nullable=False)
    confidence = Column(Float, nullable=False)
    analysis_method = Column(String(20), nullable=False)
    raw_scores = Column(Text)
    processed_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class UserDB(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
