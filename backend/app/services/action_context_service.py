import re

def analyze_action_context(transcript: str, intent_analysis: dict) -> dict:
    text = transcript.lower()
    normalized_text = re.sub(r'[^a-z0-9\s]', '', text)
    
    signals = []
    action_risk_score = 0.0
    context_risk_score = 0.0
    
    intent_signals = intent_analysis.get("signals", [])
    
    def check_keywords(keywords):
        for kw in keywords:
            kw_norm = re.sub(r'[^a-z0-9\s]', '', kw.lower())
            if re.search(r'\b' + re.escape(kw_norm) + r'\b', normalized_text):
                return True
        return False
    
    # 1. OTP/Password/PIN requests
    if "request_auth_code" in intent_signals or check_keywords(["otp", "o t p", "password", "pin", "p i n", "verification code"]):
        signals.append("auth_credential_request")
        action_risk_score += 0.8
        
    # 2. Money/payment/UPI/bank transfer requests
    if "request_payment" in intent_signals or check_keywords(["upi", "bank transfer", "wire", "pay now", "send money", "transfer money", "transfer the money"]):
        signals.append("money_transfer")
        signals.append("financial_transaction_request")
        action_risk_score += 0.7
        
    # 3. Account or credential changes
    if check_keywords(["change password", "reset password", "update details", "verify account"]):
        signals.append("account_modification_request")
        action_risk_score += 0.6
        
    # 4. Requests to click/open links or install software
    if "suspicious_action" in intent_signals or check_keywords(["click", "open the link", "download", "install", "anydesk"]):
        signals.append("risky_digital_action")
        action_risk_score += 0.6
        
    # --- Context Analysis ---
    
    # 1. Urgency / High Pressure
    if "urgency" in intent_signals or "threat" in intent_signals:
        signals.append("high_pressure_context")
        context_risk_score += 0.8
        
    # 2. Financial/Irreversible Impact
    if "financial_transaction_request" in signals:
        signals.append("financial_impact_context")
        context_risk_score += 0.7
        
    # 3. Credential Sensitivity
    if "auth_credential_request" in signals or "account_modification_request" in signals:
        signals.append("credential_sensitivity_context")
        context_risk_score += 0.7
        
    # 4. Unusual Verification Bypass or Isolation
    if "secrecy_isolation" in intent_signals or check_keywords(["bypass", "skip verification", "dont hang up", "do not hang up", "dont tell anyone", "do not tell anyone"]):
        signals.append("verification_bypass_isolation_context")
        context_risk_score += 0.6
        
    action_risk_score = min(1.0, action_risk_score)
    
    if action_risk_score == 0.0:
        context_risk_score = 0.0
    else:
        context_risk_score = min(1.0, context_risk_score)
    
    if action_risk_score >= 0.7:
        action_category = "high_risk_action"
    elif action_risk_score >= 0.4:
        action_category = "medium_risk_action"
    else:
        action_category = "low_risk_action"
        
    confidence = min(1.0, 0.6 + (len(signals) * 0.1)) if signals else 0.9
    
    return {
        "action_category": action_category,
        "action_risk_score": action_risk_score,
        "context_risk_score": context_risk_score,
        "signals": list(set(signals)),
        "confidence": confidence
    }
