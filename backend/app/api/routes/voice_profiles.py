from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.voice_profile import VoiceProfileResponse
from app.services import voice_profile_service, audio_service
import os
import json

router = APIRouter()

def format_profile_response(p) -> dict:
    features = {}
    if p.features_json:
        try:
            features = json.loads(p.features_json)
        except Exception:
            features = {}
    return {
        "profile_id": p.profile_id,
        "user_id": p.user_id,
        "display_name": p.display_name or p.user_id,
        "relationship": p.relationship or "Trusted Contact",
        "model_name": p.model_name or "vera-acoustic-imprint-v1",
        "sample_duration": round(p.sample_duration or 0.0, 2),
        "total_calls_verified": p.total_calls_verified or 0,
        "last_verified_at": p.last_verified_at,
        "created_at": p.created_at,
        "features": features
    }

@router.get("", response_model=List[VoiceProfileResponse])
def get_all_voice_profiles(db: Session = Depends(get_db)):
    """List all enrolled trusted voice profiles."""
    profiles = voice_profile_service.list_profiles(db)
    return [format_profile_response(p) for p in profiles]

@router.post("", response_model=VoiceProfileResponse, status_code=status.HTTP_201_CREATED)
async def enroll_voice_profile(
    user_id: str = Form(...),
    display_name: Optional[str] = Form(None),
    relationship: Optional[str] = Form("Trusted Contact"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Enroll a trusted contact's voiceprint with acoustic imprint extraction."""
    allowed_exts = {".wav", ".mp3", ".ogg", ".flac", ".m4a", ".webm"}
    _, ext = os.path.splitext(file.filename.lower())
    if ext not in allowed_exts and not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="Invalid audio format. Please upload a valid audio file.")
        
    try:
        y, sr, _, _ = await audio_service.load_and_normalize_audio(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio: {str(e)}")
        
    try:
        final_name = (display_name or user_id).strip()
        final_rel = (relationship or "Trusted Contact").strip()
        profile = voice_profile_service.enroll_profile(
            db=db,
            user_id=user_id.strip(),
            display_name=final_name,
            relationship=final_rel,
            audio_array=y,
            sample_rate=sr
        )
        return format_profile_response(profile)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/lookup/{user_id}", response_model=VoiceProfileResponse)
def lookup_voice_profile(user_id: str, db: Session = Depends(get_db)):
    """Look up an enrolled voice profile by phone number or contact identifier."""
    profile = voice_profile_service.get_profile_by_user_id(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail=f"No voice profile found for caller '{user_id}'")
    return format_profile_response(profile)

@router.get("/{profile_id}", response_model=VoiceProfileResponse)
def get_voice_profile(profile_id: str, db: Session = Depends(get_db)):
    profile = voice_profile_service.get_profile(db, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return format_profile_response(profile)

@router.delete("/{profile_id}", status_code=status.HTTP_200_OK)
def delete_voice_profile(profile_id: str, db: Session = Depends(get_db)):
    """Delete a trusted voice profile."""
    success = voice_profile_service.delete_profile(db, profile_id)
    if not success:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"status": "deleted", "profile_id": profile_id}

