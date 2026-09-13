from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any
import json

class VoiceProfileResponse(BaseModel):
    profile_id: str
    user_id: str
    display_name: Optional[str] = None
    relationship: Optional[str] = "Trusted Contact"
    model_name: str
    sample_duration: Optional[float] = 0.0
    total_calls_verified: Optional[int] = 0
    last_verified_at: Optional[datetime] = None
    created_at: datetime
    features: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class VoiceProfileVerifyResult(BaseModel):
    caller_id: str
    matched: bool
    similarity_score: float
    similarity_percentage: float
    status: str
    display_name: Optional[str] = None
    relationship: Optional[str] = None
    is_ai_clone_impersonation: bool = False
    warning: Optional[str] = None

