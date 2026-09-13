from sqlalchemy import Column, Integer, String, DateTime, Text, LargeBinary, Float
from datetime import datetime
from app.db.database import Base

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, unique=True, index=True)
    caller_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="active")
    risk_level = Column(String, nullable=True)
    decision = Column(String, nullable=True)

class VoiceProfileModel(Base):
    __tablename__ = "voice_profiles"

    profile_id = Column(String, primary_key=True, index=True)
    user_id = Column(String, index=True)                           # Phone number or Caller ID (e.g. +919876543210, User_A, Shivvy)
    display_name = Column(String, nullable=True)                  # Contact Name (e.g. Mom, Dad, Shivvy, Akil Modi)
    relationship = Column(String, default="Trusted Contact")      # Family, Colleague, Friend, VIP, Banker
    model_name = Column(String, default="vera-acoustic-imprint-v1")
    embedding = Column(LargeBinary)                               # 128-dim float32 L2-normalized vector
    features_json = Column(Text, default="{}")                    # Pitch, spectral centroid, formants JSON
    sample_duration = Column(Float, default=0.0)                  # Sample audio length in seconds
    total_calls_verified = Column(Integer, default=0)             # Match counter
    last_verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class CallerReputationModel(Base):
    __tablename__ = "caller_reputation"

    id = Column(Integer, primary_key=True, index=True)
    caller_id = Column(String(64), unique=True, index=True)
    display_name = Column(String(128), nullable=True)
    category = Column(String(32), default="CLEAN_NEUTRAL")  # VERIFIED_USER, CLEAN_NEUTRAL, SUSPICIOUS, SCAM_SUSPECTED, FRAUD_CONFIRMED
    trust_score = Column(Integer, default=50)               # 0 (severe fraud) to 100 (verified safe)
    total_calls_analyzed = Column(Integer, default=0)
    scam_incidents_count = Column(Integer, default=0)
    ai_clone_detected_count = Column(Integer, default=0)
    threat_tags = Column(Text, default="[]")                 # JSON string list
    last_verdict = Column(String(16), nullable=True)         # 'ALLOW', 'MONITOR', 'CHALLENGE', 'BLOCK'
    last_call_timestamp = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

