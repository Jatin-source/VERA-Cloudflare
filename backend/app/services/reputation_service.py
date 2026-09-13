import json
import logging
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.models import CallerReputationModel

logger = logging.getLogger("vera.reputation")

def to_dict(model: CallerReputationModel) -> Dict[str, Any]:
    if not model:
        return {}
    
    tags = []
    try:
        tags = json.loads(model.threat_tags) if model.threat_tags else []
    except Exception:
        tags = []

    return {
        "id": model.id,
        "caller_id": model.caller_id,
        "display_name": model.display_name or model.caller_id,
        "category": model.category or "CLEAN_NEUTRAL",
        "trust_score": model.trust_score if model.trust_score is not None else 50,
        "total_calls_analyzed": model.total_calls_analyzed or 0,
        "scam_incidents_count": model.scam_incidents_count or 0,
        "ai_clone_detected_count": model.ai_clone_detected_count or 0,
        "threat_tags": tags,
        "last_verdict": model.last_verdict,
        "last_call_timestamp": model.last_call_timestamp.isoformat() if model.last_call_timestamp else None,
        "created_at": model.created_at.isoformat() if model.created_at else None,
    }

def get_reputation(db: Session, caller_id: str) -> Optional[CallerReputationModel]:
    if not caller_id:
        return None
    return db.query(CallerReputationModel).filter(CallerReputationModel.caller_id == caller_id.strip()).first()

def get_or_create_reputation(db: Session, caller_id: str, display_name: Optional[str] = None) -> CallerReputationModel:
    clean_id = (caller_id or "unknown").strip()
    rep = get_reputation(db, clean_id)
    if not rep:
        rep = CallerReputationModel(
            caller_id=clean_id,
            display_name=display_name.strip() if display_name else clean_id,
            category="CLEAN_NEUTRAL",
            trust_score=50,
            total_calls_analyzed=0,
            scam_incidents_count=0,
            ai_clone_detected_count=0,
            threat_tags=json.dumps([]),
            last_verdict=None,
            last_call_timestamp=datetime.utcnow(),
            created_at=datetime.utcnow()
        )
        db.add(rep)
        db.commit()
        db.refresh(rep)
        logger.info(f"Initialized new caller reputation profile for: {clean_id}")
    elif display_name and not rep.display_name:
        rep.display_name = display_name.strip()
        db.commit()
        db.refresh(rep)
    return rep

def record_session_outcome(
    db: Session,
    caller_id: str,
    risk_level: str,
    decision: str,
    signals: Optional[List[str]] = None,
    has_voice_spoof: bool = False,
    display_name: Optional[str] = None,
    is_new_session: bool = True
) -> CallerReputationModel:
    rep = get_or_create_reputation(db, caller_id, display_name=display_name)
    
    if is_new_session:
        rep.total_calls_analyzed = (rep.total_calls_analyzed or 0) + 1
    rep.last_verdict = decision
    rep.last_call_timestamp = datetime.utcnow()

    existing_tags = []
    try:
        existing_tags = json.loads(rep.threat_tags) if rep.threat_tags else []
    except Exception:
        existing_tags = []

    r_lower = (risk_level or "low").lower()
    d_upper = (decision or "ALLOW").upper()

    is_high_risk = r_lower in ["high", "critical"] or d_upper == "BLOCK"
    is_medium_risk = r_lower == "medium" or d_upper in ["WARN", "CHALLENGE", "MONITOR"]

    if has_voice_spoof:
        rep.ai_clone_detected_count = (rep.ai_clone_detected_count or 0) + 1
        if "AI Voice Clone" not in existing_tags:
            existing_tags.append("AI Voice Clone")

    if is_high_risk:
        rep.scam_incidents_count = (rep.scam_incidents_count or 0) + 1
        penalty = 35 if has_voice_spoof else 25
        rep.trust_score = max(5, (rep.trust_score or 50) - penalty)
        
        if rep.ai_clone_detected_count >= 1 or rep.scam_incidents_count >= 2:
            rep.category = "FRAUD_CONFIRMED"
        else:
            rep.category = "SCAM_SUSPECTED"

    elif is_medium_risk:
        rep.trust_score = max(20, (rep.trust_score or 50) - 10)
        if rep.category not in ["FRAUD_CONFIRMED", "SCAM_SUSPECTED"]:
            rep.category = "SUSPICIOUS"

    else:
        if rep.scam_incidents_count == 0 and rep.ai_clone_detected_count == 0:
            rep.trust_score = min(98, (rep.trust_score or 50) + 4)
            if rep.total_calls_analyzed >= 3:
                rep.category = "VERIFIED_USER"
            else:
                rep.category = "CLEAN_NEUTRAL"
        else:
            rep.trust_score = min(65, (rep.trust_score or 50) + 1)

    if signals:
        for s in signals:
            clean_s = str(s).replace("_", " ").title()
            if clean_s not in existing_tags and len(existing_tags) < 8:
                existing_tags.append(clean_s)

    rep.threat_tags = json.dumps(existing_tags)
    db.commit()
    db.refresh(rep)
    logger.info(f"Updated reputation for {caller_id}: category={rep.category}, trust={rep.trust_score}")
    return rep

def manual_report(db: Session, caller_id: str, is_scam: bool, tag: Optional[str] = None) -> CallerReputationModel:
    rep = get_or_create_reputation(db, caller_id)
    existing_tags = []
    try:
        existing_tags = json.loads(rep.threat_tags) if rep.threat_tags else []
    except Exception:
        existing_tags = []

    if is_scam:
        rep.scam_incidents_count = (rep.scam_incidents_count or 0) + 1
        rep.trust_score = max(5, (rep.trust_score or 50) - 20)
        rep.category = "SCAM_SUSPECTED" if rep.scam_incidents_count < 2 else "FRAUD_CONFIRMED"
        if tag and tag not in existing_tags:
            existing_tags.append(tag)
        elif "Community Reported" not in existing_tags:
            existing_tags.append("Community Reported")
    else:
        rep.trust_score = min(98, (rep.trust_score or 50) + 10)
        if rep.scam_incidents_count == 0:
            rep.category = "VERIFIED_USER"

    rep.threat_tags = json.dumps(existing_tags)
    db.commit()
    db.refresh(rep)
    return rep
