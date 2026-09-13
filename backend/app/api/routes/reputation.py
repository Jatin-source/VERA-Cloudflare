from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import reputation_service

router = APIRouter()

class ReportRequest(BaseModel):
    is_scam: bool
    tag: Optional[str] = None
    reporter_id: Optional[str] = None

class ReputationResponse(BaseModel):
    caller_id: str
    display_name: str
    category: str
    trust_score: int
    total_calls_analyzed: int
    scam_incidents_count: int
    ai_clone_detected_count: int
    threat_tags: List[str]
    last_verdict: Optional[str] = None
    last_call_timestamp: Optional[str] = None

@router.get("/api/v1/reputation/{caller_id}", response_model=ReputationResponse)
def get_caller_reputation(caller_id: str, db: Session = Depends(get_db)):
    """
    Returns the centralized threat intelligence dossier for any caller ID / phone number.
    Called during pre-call ringing to display caller reputation.
    """
    clean_id = caller_id.strip()
    rep = reputation_service.get_or_create_reputation(db, clean_id)
    return reputation_service.to_dict(rep)

@router.post("/api/v1/reputation/{caller_id}/report", response_model=ReputationResponse)
def report_caller(caller_id: str, payload: ReportRequest, db: Session = Depends(get_db)):
    """
    Allows a user or callee to report a caller as scam or confirm as safe.
    Updates the centralized ledger and adjusts the caller's trust score.
    """
    clean_id = caller_id.strip()
    rep = reputation_service.manual_report(
        db=db,
        caller_id=clean_id,
        is_scam=payload.is_scam,
        tag=payload.tag
    )
    return reputation_service.to_dict(rep)
