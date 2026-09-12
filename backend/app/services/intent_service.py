import re
import string

def analyze_intent(transcript: str) -> dict:
    text = transcript.lower()
    # Normalize punctuation and spaces for easier matching
    normalized_text = re.sub(r'[^a-z0-9\s]', '', text)
    
    signals = []
    score = 0.0
    
    def check_keywords(keywords):
        for kw in keywords:
            kw_norm = re.sub(r'[^a-z0-9\s]', '', kw.lower())
            if re.search(r'\b' + re.escape(kw_norm) + r'\b', normalized_text):
                return True
        return False
    
    # 1. Urgency / Time Pressure
    urgency_keywords = ["immediate", "immediately", "urgent", "right now", "quickly", "before its too late", "expires", "action required"]
    if check_keywords(urgency_keywords):
        signals.append("urgency")
        score += 0.3
        
    # 2. Threats / Consequences
    threat_keywords = ["arrest", "police", "suspended", "blocked", "legal action", "warrant", "penalty"]
    if check_keywords(threat_keywords):
        signals.append("threat")
        score += 0.4
        
    # 3. Requests for OTP/Password/PIN/Sensitive Info
    auth_keywords = ["otp", "o t p", "password", "pin", "p i n", "verification code", "social security", "one time password", "access code"]
    if check_keywords(auth_keywords):
        signals.append("request_auth_code")
        score += 0.6
        
    # 4. Requests for Money/Payment
    payment_keywords = ["wire transfer", "transfer money", "transfer the money", "gift card", "crypto", "bitcoin", "pay now", "send money", "western union", "bank details", "account", "this account"]
    if check_keywords(payment_keywords):
        signals.append("request_payment")
        score += 0.5
        
    # 5. Impersonation Claims
    impersonation_keywords = ["irs", "tax agency", "tech support", "microsoft support", "bank fraud department", "fbi", "government", "security alert"]
    if check_keywords(impersonation_keywords):
        signals.append("impersonation_claim")
        score += 0.3
        
    # 6. Secrecy / Isolation Requests
    secrecy_keywords = ["dont tell anyone", "do not tell anyone", "keep this private", "secret", "stay on the line", "do not hang up", "dont hang up"]
    if check_keywords(secrecy_keywords):
        signals.append("secrecy_isolation")
        score += 0.3
        
    # 7. Suspicious Links / Actions
    action_keywords = ["download this", "click the link", "install anydesk", "teamviewer", "remote access", "open this website"]
    if check_keywords(action_keywords):
        signals.append("suspicious_action")
        score += 0.4

    final_score = min(1.0, score)
    
    if final_score >= 0.7:
        category = "high_risk_scam"
    elif final_score >= 0.4:
        category = "suspicious_request"
    elif final_score > 0:
        category = "mildly_suspicious"
    else:
        category = "benign"
        
    confidence = min(1.0, 0.5 + (len(signals) * 0.1)) if signals else 0.9
    
    return {
        "intent_category": category,
        "social_engineering_score": final_score,
        "signals": signals,
        "confidence": confidence
    }
