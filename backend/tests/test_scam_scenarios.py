import pytest
from app.services.intent_service import analyze_intent
from app.services.action_context_service import analyze_action_context
from app.services.risk_fusion_service import calculate_risk

def test_regression_otp_request():
    transcript = "Please share the OTP you just received."
    intent = analyze_intent(transcript)
    action = analyze_action_context(transcript, intent)
    assert "request_auth_code" in intent["signals"] or "auth_credential_request" in action["signals"]

def test_regression_money_transfer():
    transcript = "transfer the money to this account"
    intent = analyze_intent(transcript)
    action = analyze_action_context(transcript, intent)
    assert "request_payment" in intent["signals"] or "money_transfer" in action["signals"]

def test_regression_urgency():
    transcript = "This is an urgent security alert."
    intent = analyze_intent(transcript)
    assert "urgency" in intent["signals"]

def test_regression_secrecy():
    transcript = "Do not tell anyone about this transaction."
    intent = analyze_intent(transcript)
    assert "secrecy_isolation" in intent["signals"]

def test_regression_otp_money_urgency_critical():
    transcript = "This is an urgent security alert. Please share the OTP you just received and transfer the money to this account immediately. Do not tell anyone about this transaction."
    
    intent = analyze_intent(transcript)
    action = analyze_action_context(transcript, intent)
    
    # Assume a genuine voice
    voice = {"voice_integrity_score": 0.1, "confidence": 1.0}
    
    res = calculate_risk(voice_analysis=voice, intent_analysis=intent, action_context_analysis=action)
    
    assert res["risk_level"] == "critical"
    assert res["overall_risk_score"] >= 0.85
