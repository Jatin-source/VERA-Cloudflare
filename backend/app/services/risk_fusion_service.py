def calculate_risk(
    voice_analysis: dict = None, 
    intent_analysis: dict = None, 
    action_context_analysis: dict = None,
    identity_claim_analysis: dict = None
) -> dict:
    signals = []
    total_weight = 0.0
    weighted_sum = 0.0
    total_confidence = 0.0
    confidence_weight = 0.0
    
    # Milestone 16: Extract Identity Claim Details
    has_identity_claim = False
    claimed_entity = None
    authority_type = None
    if identity_claim_analysis and identity_claim_analysis.get('has_claim'):
        has_identity_claim = True
        claimed_entity = identity_claim_analysis.get('claimed_entity')
        authority_type = identity_claim_analysis.get('authority_type')
        for sig in identity_claim_analysis.get('signals', []):
            if sig not in signals:
                signals.append(sig)
        if 'authority_claim_detected' not in signals:
            signals.append('authority_claim_detected')
    
    # Extract scores
    ai_prob = 0.0
    vi_conf = 1.0
    has_voice = False
    if voice_analysis and voice_analysis.get('state') != 'NO_SPEECH':
        has_voice = True
        vi_conf = voice_analysis.get('confidence', 1.0)
        if 'ai_voice_probability' in voice_analysis and voice_analysis['ai_voice_probability'] is not None:
            ai_prob = float(voice_analysis['ai_voice_probability'])
        elif 'voice_integrity_score' in voice_analysis and voice_analysis['voice_integrity_score'] is not None:
            raw_vi = float(voice_analysis['voice_integrity_score'])
            if raw_vi > 1.0:
                raw_vi = raw_vi / 100.0
            ai_prob = max(0.0, min(1.0, 1.0 - raw_vi))
    
    in_score = intent_analysis.get('social_engineering_score', 0.0) if intent_analysis else 0.0
    in_conf = intent_analysis.get('confidence', 1.0) if intent_analysis else 1.0
    intent_signals = intent_analysis.get('signals', []) if intent_analysis else []
    
    ac_score = 0.0
    ac_conf = 1.0
    ac_signals = []
    if action_context_analysis:
        ac_score = max(
            action_context_analysis.get('action_risk_score', 0.0),
            action_context_analysis.get('context_risk_score', 0.0)
        )
        ac_conf = action_context_analysis.get('confidence', 1.0)
        ac_signals = action_context_analysis.get('signals', [])

    if ai_prob >= 0.60:
        signals.append('high_voice_manipulation_probability')
    signals.extend(intent_signals)
    for sig in ac_signals:
        if sig not in signals:
            signals.append(sig)

    # Determine Context-Adaptive Weights
    if ai_prob >= 0.70:
        # STRONG AI-GENERATED / SYNTHETIC VOICE
        w_voice = 0.70
        w_intent = 0.15
        w_action = 0.15
    elif has_identity_claim and (in_score >= 0.4 or ac_score >= 0.4):
        # AUTHORITY CLAIM + SUSPICIOUS ACTIONS
        w_voice = 0.20
        w_intent = 0.40
        w_action = 0.40
    elif in_score >= 0.6 or ac_score >= 0.6:
        # HIGH-STAKES FINANCIAL + SUSPICIOUS INTENT
        w_voice = 0.30
        w_intent = 0.40
        w_action = 0.30
    else:
        # NORMAL CONVERSATION
        w_voice = 0.50
        w_intent = 0.25
        w_action = 0.25

    # Apply Weights
    if has_voice:
        weighted_sum += ai_prob * w_voice
        total_weight += w_voice
        total_confidence += vi_conf * w_voice
        confidence_weight += w_voice
        
    if intent_analysis:
        weighted_sum += in_score * w_intent
        total_weight += w_intent
        total_confidence += in_conf * w_intent
        confidence_weight += w_intent
        
    if action_context_analysis:
        weighted_sum += ac_score * w_action
        total_weight += w_action
        total_confidence += ac_conf * w_action
        confidence_weight += w_action

    overall_risk_score = 0.0
    final_confidence = 0.0
    if total_weight > 0:
        overall_risk_score = max(0.0, min(1.0, weighted_sum / total_weight))
        final_confidence = total_confidence / confidence_weight

    # Security Escalation Rules
    
    # Check for specific dangerous combinations
    has_otp_pin = any(s in signals for s in ['request_auth_code', 'auth_credential_request', 'password_request'])
    has_money_transfer = any(s in signals for s in ['money_transfer', 'payment_request', 'account_change', 'financial_transaction_request'])
    has_urgency = any(s in signals for s in ['urgency', 'high_pressure_context'])
    has_risky_action = any(s in signals for s in ['risky_digital_action', 'suspicious_action', 'account_modification_request'])
    
    escalated = False
    
    # Milestone 16: Authority Impersonation Scam Escalation
    if has_identity_claim:
        # If caller claims authority AND demands OTP, money transfer, or remote action:
        if has_otp_pin or has_money_transfer or has_risky_action:
            overall_risk_score = max(overall_risk_score, 0.88)
            signals.append('impersonation_authority_claim')
            escalated = True
        elif has_urgency:
            # Authority claim + high pressure/threat tactics
            overall_risk_score = max(overall_risk_score, 0.75)
            signals.append('impersonation_authority_claim')
            escalated = True
        elif authority_type in ['FINANCIAL', 'LAW_ENFORCEMENT']:
            # Base vigilance elevation for financial/police claims without actions yet
            overall_risk_score = max(overall_risk_score, 0.45)
    
    if has_otp_pin and has_money_transfer and has_urgency:
        overall_risk_score = max(overall_risk_score, 0.90)
        escalated = True
    elif in_score >= 0.7 and ac_score >= 0.7:
        overall_risk_score = max(overall_risk_score, 0.75)
        escalated = True
        
    if has_voice and ai_prob >= 0.70:
        overall_risk_score = max(overall_risk_score, 0.65)
        escalated = True

    # Demotion / Clamping
    # Genuine voice + normal conversation without suspicious behavior OR authority claims -> should remain LOW
    if not escalated and not has_identity_claim and (not has_voice or ai_prob < 0.30) and in_score < 0.4 and ac_score < 0.4:
        overall_risk_score = min(overall_risk_score, 0.20)
        
    if overall_risk_score >= 0.85:
        risk_level = 'critical'
    elif overall_risk_score >= 0.60:
        risk_level = 'high'
    elif overall_risk_score >= 0.30:
        risk_level = 'medium'
    else:
        risk_level = 'low'

    return {
        'overall_risk_score': round(overall_risk_score, 4),
        'risk_level': risk_level,
        'contributing_signals': list(set(signals)),
        'confidence': round(final_confidence, 4)
    }
