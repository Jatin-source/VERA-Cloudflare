def evaluate_policy(
    risk_analysis: dict, 
    action_context_analysis: dict, 
    identity_claim_analysis: dict = None
) -> dict:
    """
    Evaluates the fused risk score, action contexts, and caller identity claims to determine a final policy decision.
    Rules:
    - low risk → allow
    - medium risk → warn
    - high risk → verify
    - critical risk → block
    
    Escalation:
    - Critical actions (OTP, financial, remote access, account takeover) escalate the decision by one level.
    - High-stakes authority impersonation claims mandate identity verification ('verify') or call blocking ('block').
    """
    risk_level = risk_analysis.get("risk_level", "low")
    risk_signals = risk_analysis.get("contributing_signals", [])
    
    # Base decision
    base_mapping = {
        "low": "allow",
        "medium": "warn",
        "high": "verify",
        "critical": "block"
    }
    
    decision_hierarchy = ["allow", "warn", "verify", "block"]
    
    base_decision = base_mapping.get(risk_level, "allow")
    current_level_idx = decision_hierarchy.index(base_decision)
    
    # Check for critical actions
    signals = action_context_analysis.get("signals", [])
    critical_signals = {
        "auth_credential_request", 
        "financial_transaction_request", 
        "risky_digital_action", 
        "account_modification_request"
    }
    
    found_critical = any(sig in critical_signals for sig in signals)
    
    escalated = False
    final_decision = base_decision
    reason = f"Base risk level is {risk_level}."
    
    if found_critical and current_level_idx < len(decision_hierarchy) - 1:
        # Escalate decision
        final_decision = decision_hierarchy[current_level_idx + 1]
        escalated = True
        reason = f"Escalated from {base_decision} to {final_decision} due to critical action signals."
        
    # Milestone 16: Authority Impersonation Policy Enforcement
    has_claim = False
    claimed_entity = None
    if identity_claim_analysis and identity_claim_analysis.get("has_claim"):
        has_claim = True
        claimed_entity = identity_claim_analysis.get("claimed_entity")
    elif "authority_claim_detected" in risk_signals:
        has_claim = True

    if "impersonation_authority_claim" in risk_signals:
        if risk_level == "critical":
            final_decision = "block"
        else:
            final_decision = "verify"
        escalated = True
        reason = f"Severe authority impersonation threat detected. Caller claimed representation ({claimed_entity or 'Official'})."
    elif has_claim and decision_hierarchy.index(final_decision) < decision_hierarchy.index("verify"):
        final_decision = "verify"
        escalated = True
        reason = f"Authority claim detected ({claimed_entity or 'Official'}). Out-of-band caller verification recommended."

    return {
        "decision": final_decision,
        "escalated": escalated,
        "reason": reason
    }
