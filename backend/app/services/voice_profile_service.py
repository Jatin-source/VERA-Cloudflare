import uuid
import json
import logging
from datetime import datetime
from typing import List, Optional
import numpy as np
from sqlalchemy.orm import Session
from app.db.models import VoiceProfileModel
from app.services import speaker_verification_service

logger = logging.getLogger("vera.voice_profile_service")

def enroll_profile(
    db: Session,
    user_id: str,
    display_name: str,
    relationship: str,
    audio_array: np.ndarray,
    sample_rate: int = 16000
) -> VoiceProfileModel:
    if len(audio_array) == 0:
        raise ValueError("Audio array is empty")
        
    vec, biometrics = speaker_verification_service.extract_voice_imprint(audio_array, sample_rate)
    embedding_bytes = vec.tobytes()
    features_str = json.dumps(biometrics)
    duration = float(biometrics.get("duration_sec", len(audio_array) / sample_rate))

    # Check if a profile for this user_id / caller_id already exists
    existing = db.query(VoiceProfileModel).filter(VoiceProfileModel.user_id == user_id.strip()).first()
    if existing:
        existing.display_name = display_name.strip()
        existing.relationship = relationship.strip()
        existing.embedding = embedding_bytes
        existing.features_json = features_str
        existing.sample_duration = duration
        existing.model_name = "vera-acoustic-imprint-v1"
        existing.created_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        logger.info(f"Updated existing voice profile for {user_id} ({display_name})")
        return existing

    profile_id = str(uuid.uuid4())
    db_profile = VoiceProfileModel(
        profile_id=profile_id,
        user_id=user_id.strip(),
        display_name=display_name.strip(),
        relationship=relationship.strip() or "Trusted Contact",
        model_name="vera-acoustic-imprint-v1",
        embedding=embedding_bytes,
        features_json=features_str,
        sample_duration=duration,
        total_calls_verified=0,
        last_verified_at=None,
        created_at=datetime.utcnow()
    )
    
    db.add(db_profile)
    db.commit()
    db.refresh(db_profile)
    logger.info(f"Enrolled new voice profile {profile_id} for {user_id} ({display_name})")
    return db_profile

def list_profiles(db: Session) -> List[VoiceProfileModel]:
    return db.query(VoiceProfileModel).order_by(VoiceProfileModel.created_at.desc()).all()

def get_profile(db: Session, profile_id: str) -> Optional[VoiceProfileModel]:
    return db.query(VoiceProfileModel).filter(VoiceProfileModel.profile_id == profile_id).first()

def get_profile_by_user_id(db: Session, user_id: str) -> Optional[VoiceProfileModel]:
    if not user_id:
        return None
    cleaned = user_id.strip()
    # Exact match first
    prof = db.query(VoiceProfileModel).filter(VoiceProfileModel.user_id == cleaned).first()
    if prof:
        return prof
    # Also match if display_name matches
    prof_by_name = db.query(VoiceProfileModel).filter(VoiceProfileModel.display_name.ilike(cleaned)).first()
    if prof_by_name:
        return prof_by_name
    # Strip leading + or 0 if phone
    digits = "".join(filter(str.isdigit, cleaned))
    if len(digits) >= 7:
        all_profs = db.query(VoiceProfileModel).all()
        for p in all_profs:
            p_digits = "".join(filter(str.isdigit, p.user_id or ""))
            if p_digits and (p_digits.endswith(digits) or digits.endswith(p_digits)):
                return p
    return None

def delete_profile(db: Session, profile_id: str) -> bool:
    prof = db.query(VoiceProfileModel).filter(VoiceProfileModel.profile_id == profile_id).first()
    if not prof:
        return False
    db.delete(prof)
    db.commit()
    logger.info(f"Deleted voice profile {profile_id}")
    return True

def record_verification_match(db: Session, profile_id: str):
    prof = db.query(VoiceProfileModel).filter(VoiceProfileModel.profile_id == profile_id).first()
    if prof:
        prof.total_calls_verified = (prof.total_calls_verified or 0) + 1
        prof.last_verified_at = datetime.utcnow()
        db.commit()

