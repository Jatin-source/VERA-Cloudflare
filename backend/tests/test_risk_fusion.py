import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from tests.test_audio import create_dummy_wav
from app.services.risk_fusion_service import calculate_risk

client = TestClient(app)

def test_1_genuine_normal():
    voice = {"voice_integrity_score": 0.1, "confidence": 1.0}
    intent = {"social_engineering_score": 0.1, "signals": [], "confidence": 1.0}
    action = {"action_risk_score": 0.1, "context_risk_score": 0.1, "signals": [], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] == "low"

def test_2_genuine_legit_financial():
    voice = {"voice_integrity_score": 0.1, "confidence": 1.0}
    intent = {"social_engineering_score": 0.1, "signals": [], "confidence": 1.0}
    action = {"action_risk_score": 0.4, "context_risk_score": 0.4, "signals": ["money_transfer"], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] in ["low", "medium"]

def test_3_genuine_otp_request():
    voice = {"voice_integrity_score": 0.1, "confidence": 1.0}
    intent = {"social_engineering_score": 0.8, "signals": ["request_auth_code"], "confidence": 1.0}
    action = {"action_risk_score": 0.8, "context_risk_score": 0.8, "signals": ["auth_credential_request"], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] in ["high", "critical"]

def test_4_genuine_otp_transfer_urgency():
    voice = {"voice_integrity_score": 0.1, "confidence": 1.0}
    intent = {"social_engineering_score": 0.9, "signals": ["request_auth_code", "urgency"], "confidence": 1.0}
    action = {"action_risk_score": 0.9, "context_risk_score": 0.9, "signals": ["auth_credential_request", "money_transfer"], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] == "critical"

def test_5_ai_voice_harmless():
    voice = {"voice_integrity_score": 0.9, "confidence": 1.0}
    intent = {"social_engineering_score": 0.1, "signals": [], "confidence": 1.0}
    action = {"action_risk_score": 0.1, "context_risk_score": 0.1, "signals": [], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] == "high"

def test_6_ai_voice_financial_scam():
    voice = {"voice_integrity_score": 0.9, "confidence": 1.0}
    intent = {"social_engineering_score": 0.9, "signals": ["urgency", "request_auth_code"], "confidence": 1.0}
    action = {"action_risk_score": 0.9, "context_risk_score": 0.9, "signals": ["money_transfer", "auth_credential_request"], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] == "critical"

def test_7_normal_benign():
    voice = {"voice_integrity_score": 0.2, "confidence": 1.0}
    intent = {"social_engineering_score": 0.0, "signals": [], "confidence": 1.0}
    action = {"action_risk_score": 0.0, "context_risk_score": 0.0, "signals": [], "confidence": 1.0}
    res = calculate_risk(voice, intent, action)
    assert res["risk_level"] == "low"

@patch("app.services.voice_integrity_service.analyze_voice")
@patch("app.services.asr_service.transcribe_audio")
def test_analyze_session_risk_endpoint(mock_transcribe, mock_analyze):
    mock_analyze.return_value = {"voice_integrity_score": 0.1, "confidence": 0.9, "label": "genuine", "model_name": "test"}
    mock_transcribe.return_value = {"transcript": "hello world", "language": "en", "model_name": "test", "confidence": 0.9}
    
    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]
    
    wav_bytes = create_dummy_wav()
    files = {"file": ("test_voice.wav", wav_bytes, "audio/wav")}
    
    resp2 = client.post(f"/api/v1/sessions/{session_id}/risk", files=files)
    assert resp2.status_code == 200
    body = resp2.json()
    
    assert body["session_id"] == session_id
    assert body["status"] == "success"
    
    risk = body["data"]["risk_analysis"]
    assert risk["risk_level"] == "low"
    assert risk["overall_risk_score"] < 0.25

def test_analyze_session_risk_invalid_session():
    wav_bytes = create_dummy_wav()
    files = {"file": ("test.wav", wav_bytes, "audio/wav")}
    
    resp = client.post("/api/v1/sessions/invalid-session/risk", files=files)
    assert resp.status_code == 404
