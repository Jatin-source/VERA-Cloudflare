from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class SessionCreate(BaseModel):
    caller_id: Optional[str] = None

class SessionResponse(BaseModel):
    id: int
    session_id: str
    caller_id: Optional[str] = None
    caller_name: Optional[str] = None
    reputation_category: Optional[str] = None
    trust_score: Optional[int] = None
    threat_tags: Optional[List[str]] = None
    scam_count: Optional[int] = None
    created_at: datetime
    status: str
    risk_level: Optional[str] = None
    decision: Optional[str] = None

    class Config:
        from_attributes = True

