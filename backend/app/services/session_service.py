import uuid
import json
from sqlalchemy.orm import Session
from app.db.models import SessionModel
from app.schemas.session import SessionCreate
from app.services import reputation_service

def _enrich_session(db: Session, s: SessionModel) -> SessionModel:
    if not s:
        return s
    caller = (s.caller_id or "").strip()
    if caller:
        rep = reputation_service.get_reputation(db, caller)
        if rep:
            s.caller_name = rep.display_name or caller
            s.reputation_category = rep.category
            s.trust_score = rep.trust_score
            s.scam_count = rep.scam_incidents_count
            try:
                s.threat_tags = json.loads(rep.threat_tags) if rep.threat_tags else []
            except Exception:
                s.threat_tags = []
        else:
            s.caller_name = caller
            s.reputation_category = "CLEAN_NEUTRAL"
            s.trust_score = 50
            s.scam_count = 0
            s.threat_tags = []
    else:
        s.caller_name = "Unknown"
        s.reputation_category = "CLEAN_NEUTRAL"
        s.trust_score = 50
        s.scam_count = 0
        s.threat_tags = []
    return s

def create_session(db: Session, session_in: SessionCreate) -> SessionModel:
    caller = session_in.caller_id.strip() if session_in.caller_id else None
    db_session = SessionModel(
        session_id=str(uuid.uuid4()),
        caller_id=caller
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    
    if caller:
        reputation_service.get_or_create_reputation(db, caller)
        
    return _enrich_session(db, db_session)

def get_session(db: Session, session_id: str) -> SessionModel:
    s = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if s:
        _enrich_session(db, s)
    return s

def list_sessions(db: Session, limit: int = 50):
    sessions = db.query(SessionModel).order_by(SessionModel.created_at.desc()).limit(limit).all()
    for s in sessions:
        _enrich_session(db, s)
    return sessions

def update_session(db: Session, session_id: str, updates: dict) -> SessionModel:
    db_session = db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
    if db_session:
        for key, value in updates.items():
            setattr(db_session, key, value)
        db.commit()
        db.refresh(db_session)
        _enrich_session(db, db_session)
    return db_session

