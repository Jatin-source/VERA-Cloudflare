import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.services.identity_claim_service import analyze_identity_claim
from app.services.risk_fusion_service import calculate_risk
from app.services.policy_service import evaluate_policy
from tests.test_audio import create_dummy_wav

client = TestClient(app)

def test_detect_financial_claim():
    transcript = "Hello sir, I am calling from State Bank of India fraud prevention department regarding your card."
    result = analyze_identity_claim(transcript)
    assert result["has_claim"] is True
    assert result["authority_type"] == "FINANCIAL"
    assert "State Bank of India" in result["claimed_entity"]
    assert result["confidence"] >= 0.85
    assert "authority_claim_financial" in result["signals"]

def test_detect_law_enforcement_claim():
    transcript = "This is Inspector Sharma calling from Cyber Crime Cell. A warrant has been issued in your name."
    result = analyze_identity_claim(transcript)
    assert result["has_claim"] is True
    assert result["authority_type"] == "LAW_ENFORCEMENT"
    assert "Cyber Crime" in result["claimed_entity"]
    assert result["confidence"] >= 0.85
    assert "high_stakes_authority_representation" in result["signals"]

def test_detect_tech_support_claim():
    transcript = "We are calling from Microsoft Support regarding critical virus activity on your computer."
    result = analyze_identity_claim(transcript)
    assert result["has_claim"] is True
    assert result["authority_type"] == "TECH_SUPPORT"
    assert "Microsoft Support" in result["claimed_entity"]

def test_benign_casual_mentions():
    t1 = "I bought a pair of running shoes on Amazon yesterday."
    res1 = analyze_identity_claim(t1)
    assert res1["has_claim"] is False

    t2 = "I need to go to the bank to deposit a check this afternoon."
    res2 = analyze_identity_claim(t2)
    assert res2["has_claim"] is False

    t3 = "The police car drove past our house ten minutes ago."
    res3 = analyze_identity_claim(t3)
    assert res3["has_claim"] is False

def test_empty_and_noise_transcripts():
    assert analyze_identity_claim("")["has_claim"] is False
    assert analyze_identity_claim("   ")["has_claim"] is False
    assert analyze_identity_claim("hello yes ok")["has_claim"] is False

def test_risk_fusion_authority_impersonation_escalation():
    claim = {
        "has_claim": True,
        "claimed_entity": "HDFC Bank",
        "authority_type": "FINANCIAL",
        "signals": ["authority_claim_financial", "high_stakes_authority_representation"]
    }
    voice = {"ai_voice_probability": 0.05, "voice_integrity_score": 0.95, "confidence": 0.9}
    intent = {"social_engineering_score": 0.6, "signals": ["request_auth_code"], "confidence": 0.9}
    action = {"action_risk_score": 0.8, "context_risk_score": 0.8, "signals": ["auth_credential_request"], "confidence": 0.9}

    res = calculate_risk(
        voice_analysis=voice,
        intent_analysis=intent,
        action_context_analysis=action,
        identity_claim_analysis=claim
    )

    assert res["risk_level"] == "critical"
    assert res["overall_risk_score"] >= 0.88
    assert "impersonation_authority_claim" in res["contributing_signals"]

def test_risk_fusion_authority_claim_alone_elevates_vigilance():
    claim = {
        "has_claim": True,
        "claimed_entity": "State Bank of India (SBI)",
        "authority_type": "FINANCIAL",
        "signals": ["authority_claim_financial"]
    }
    voice = {"ai_voice_probability": 0.02, "voice_integrity_score": 0.98, "confidence": 0.9}
    intent = {"social_engineering_score": 0.1, "signals": [], "confidence": 0.9}
    action = {"action_risk_score": 0.1, "context_risk_score": 0.1, "signals": [], "confidence": 0.9}

    res = calculate_risk(
        voice_analysis=voice,
        intent_analysis=intent,
        action_context_analysis=action,
        identity_claim_analysis=claim
    )

    assert res["overall_risk_score"] >= 0.40
    assert res["risk_level"] in ["medium", "high", "critical"]

def test_policy_enforcement_for_authority_claims():
    risk_critical = {
        "risk_level": "critical",
        "contributing_signals": ["impersonation_authority_claim", "request_auth_code"]
    }
    action = {"signals": ["auth_credential_request"]}
    claim = {"has_claim": True, "claimed_entity": "Cyber Crime Cell"}

    pol = evaluate_policy(risk_critical, action, identity_claim_analysis=claim)
    assert pol["decision"] == "block"
    assert pol["escalated"] is True

    risk_med = {
        "risk_level": "medium",
        "contributing_signals": ["authority_claim_detected"]
    }
    action_benign = {"signals": []}
    pol_med = evaluate_policy(risk_med, action_benign, identity_claim_analysis=claim)
    assert pol_med["decision"] == "verify"
    assert pol_med["escalated"] is True

@patch("app.services.asr_service.transcribe_audio")
def test_identity_claim_session_endpoint(mock_transcribe):
    mock_transcribe.return_value = {
        "transcript": "I am calling from HDFC Bank customer security team",
        "language": "en",
        "confidence": 0.95
    }

    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]

    wav_bytes = create_dummy_wav()
    files = {"file": ("test.wav", wav_bytes, "audio/wav")}

    resp_claim = client.post(f"/api/v1/sessions/{session_id}/identity-claim", files=files)
    assert resp_claim.status_code == 200
    data = resp_claim.json()["data"]
    assert "identity_claim" in data
    assert data["identity_claim"]["has_claim"] is True
    assert data["identity_claim"]["authority_type"] == "FINANCIAL"
