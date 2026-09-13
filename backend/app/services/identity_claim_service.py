import re
from typing import Dict, Any, Optional, List, Tuple

# Curated High-Risk Entity Knowledge Base categorized by Authority Type
AUTHORITY_ENTITIES = {
    "FINANCIAL": [
        {"canonical": "State Bank of India (SBI)", "patterns": [r"state\s+bank(?:\s+of\s+india)?", r"\bsbi\b", r"sbi\s+bank", r"yono\s+sbi"]},
        {"canonical": "HDFC Bank", "patterns": [r"hdfc(?:\s+bank)?", r"hdfc\s+security"]},
        {"canonical": "ICICI Bank", "patterns": [r"icici(?:\s+bank)?", r"imobile"]},
        {"canonical": "Axis Bank", "patterns": [r"axis(?:\s+bank)?"]},
        {"canonical": "Punjab National Bank (PNB)", "patterns": [r"punjab\s+national\s+bank", r"\bpnb\b"]},
        {"canonical": "Bank of Baroda", "patterns": [r"bank\s+of\s+baroda", r"\bbob\b"]},
        {"canonical": "Kotak Mahindra Bank", "patterns": [r"kotak(?:\s+mahindra)?(?:\s+bank)?", r"kotak\s+811"]},
        {"canonical": "Reserve Bank of India (RBI)", "patterns": [r"reserve\s+bank(?:\s+of\s+india)?", r"\brbi\b"]},
        {"canonical": "Wells Fargo", "patterns": [r"wells\s+fargo"]},
        {"canonical": "Chase Bank", "patterns": [r"chase(?:\s+bank)?", r"jpmorgan(?:\s+chase)?"]},
        {"canonical": "Bank of America", "patterns": [r"bank\s+of\s+america", r"\bboa\b"]},
        {"canonical": "Citibank", "patterns": [r"citi(?:\s+bank)?"]},
        {"canonical": "PayPal", "patterns": [r"paypal"]},
        {"canonical": "Paytm", "patterns": [r"paytm"]},
        {"canonical": "Income Tax Department / IRS", "patterns": [r"income\s+tax(?:\s+department)?", r"\birs\b", r"internal\s+revenue\s+service", r"tax\s+authority"]},
        {"canonical": "Generic Financial Institution", "patterns": [r"the\s+bank", r"your\s+bank", r"credit\s+card\s+(?:division|department|cell)", r"fraud\s+(?:prevention|monitoring|detection)\s+(?:department|cell|team)"]}
    ],
    "LAW_ENFORCEMENT": [
        {"canonical": "Cyber Crime Cell", "patterns": [r"cyber(?:\s+crime)?(?:\s+cell|\s+department|\s+branch|\s+police|\s+unit)?", r"1930(?:\s+helpline)?", r"national\s+cyber\s+crime"]},
        {"canonical": "Police Department", "patterns": [r"(?:delhi|mumbai|bangalore|kolkata|chennai|city|state|local)?\s*police(?:\s+department|\s+station|\s+headquarters)?", r"crime\s+branch", r"police\s+inspector", r"police\s+commissioner"]},
        {"canonical": "Central Bureau of Investigation (CBI)", "patterns": [r"central\s+bureau\s+of\s+investigation", r"\bcbi\b"]},
        {"canonical": "Federal Bureau of Investigation (FBI)", "patterns": [r"federal\s+bureau\s+of\s+investigation", r"\bfbi\b"]},
        {"canonical": "Customs & Border Control", "patterns": [r"customs(?:\s+department|\s+office|\s+bureau|\s+official)?", r"narcotics\s+control(?:\s+bureau)?", r"\bncb\b"]},
        {"canonical": "Judicial Court / Ministry of Law", "patterns": [r"(?:supreme|high|district|magistrate)?\s*court", r"legal\s+department", r"ministry\s+of\s+home\s+affairs", r"\bmha\b", r"enforcement\s+directorate", r"\bed\b"]}
    ],
    "TECH_SUPPORT": [
        {"canonical": "Microsoft Support", "patterns": [r"microsoft(?:\s+support|\s+security|\s+windows)?", r"windows\s+security\s+team"]},
        {"canonical": "Apple Support", "patterns": [r"apple(?:\s+support|\s+care|\s+security)?", r"icloud\s+security"]},
        {"canonical": "Google Security", "patterns": [r"google(?:\s+security|\s+account|\s+support)?"]},
        {"canonical": "Telecom Regulatory Authority (TRAI)", "patterns": [r"telecom\s+regulatory\s+authority", r"\btrai\b", r"department\s+of\s+telecommunications", r"\bdot\b"]},
        {"canonical": "Telecom Service Provider", "patterns": [r"(?:airtel|jio|vodafone|vi|verizon|at&t|t-mobile)\s+(?:support|customer\s+care|verification\s+team)"]}
    ],
    "LOGISTICS_COMMERCE": [
        {"canonical": "FedEx", "patterns": [r"fedex(?:\s+express|\s+courier)?"]},
        {"canonical": "DHL Express", "patterns": [r"dhl(?:\s+express)?"]},
        {"canonical": "Blue Dart", "patterns": [r"blue\s+dart"]},
        {"canonical": "Amazon Customer Service", "patterns": [r"amazon(?:\s+customer\s+service|\s+fraud\s+team|\s+support)?"]},
        {"canonical": "India Post", "patterns": [r"india\s+post(?:\s+office)?", r"postal\s+service"]}
    ],
    "PERSONAL_EMERGENCY": [
        {"canonical": "Hospital / Emergency Services", "patterns": [r"hospital(?:\s+emergency|\s+casualty)?", r"emergency\s+doctor", r"ambulance\s+control"]},
        {"canonical": "Distressed Relative / Acquaintance", "patterns": [r"(?:your\s+son|your\s+daughter|your\s+nephew|your\s+brother|your\s+friend)\s+(?:is\s+arrested|had\s+an\s+accident|is\s+in\s+trouble|is\s+in\s+custody)"]}
    ]
}

# Role / Designation keywords
ROLE_PATTERNS = [
    (r"(?:fraud|anti-fraud|risk)\s+(?:investigator|officer|analyst|executive|agent|manager)", "Fraud Investigation Officer"),
    (r"(?:cyber|police|customs)\s+(?:inspector|officer|constable|commissioner|investigator)", "Law Enforcement Officer"),
    (r"(?:technical|customer|account)\s+(?:support|representative|executive|agent|technician)", "Customer Support Representative"),
    (r"(?:branch|compliance|security)\s+(?:manager|head|director)", "Branch / Security Manager"),
    (r"(?:attorney|advocate|lawyer|judge)", "Legal Counsel"),
    (r"(?:officer|inspector|agent|investigator)", "Officer / Agent")
]

# Representation Anchor Patterns (Must establish first-person representation)
REPRESENTATION_ANCHORS = [
    r"\b(?:i\s+am|i'm|this\s+is|my\s+name\s+is)\s+(?:[a-zA-Z]+\s+)?(?:calling\s+)?(?:from|on\s+behalf\s+of|with|at)\s+",
    r"\b(?:calling\s+from|speaking\s+from)\s+(?:the\s+)?",
    r"\bwe\s+are\s+(?:calling\s+)?from\s+(?:the\s+)?",
    r"\bthis\s+is\s+(?:the\s+)?(?:fraud|security|investigation|support|billing)\s+(?:department|cell|unit)\s+of\s+",
    r"\bon\s+behalf\s+of\s+(?:the\s+)?",
    r"\b(?:representing|speaking\s+for)\s+(?:the\s+)?",
    r"\bfrom\s+(?:the\s+)?(?:cyber\s+crime|police|customs|cbi|fbi|narcotics)\s+(?:cell|unit|branch|department)\b"
]

def analyze_identity_claim(transcript: str) -> Dict[str, Any]:
    """
    Analyzes live conversational transcript to detect whether the remote caller is
    claiming to represent an authoritative organization, financial institution, or government agency.
    
    Sub-15ms execution time, deterministic, zero third-party dependencies.
    """
    if not transcript or not transcript.strip():
        return {
            "has_claim": False,
            "claimed_entity": None,
            "authority_type": None,
            "claimed_role": None,
            "confidence": 0.0,
            "raw_claim_text": None,
            "signals": []
        }

    text_lower = transcript.lower()
    signals = []

    # 1. Check for First-Person Representation Anchor
    matched_anchor = None
    for anchor_regex in REPRESENTATION_ANCHORS:
        match = re.search(anchor_regex, text_lower)
        if match:
            matched_anchor = match.group(0)
            break

    # 2. Check for Role match
    detected_role = None
    for role_regex, role_name in ROLE_PATTERNS:
        if re.search(r"\b" + role_regex + r"\b", text_lower):
            detected_role = role_name
            break

    # 3. Check for Entity match across Authority Categories
    detected_entity = None
    detected_authority = None
    is_direct_claim = False

    for auth_type, entity_list in AUTHORITY_ENTITIES.items():
        for entity in entity_list:
            for pattern in entity["patterns"]:
                entity_match = re.search(r"\b" + pattern + r"\b", text_lower)
                if entity_match:
                    # Determine if entity is mentioned in representative context
                    if matched_anchor:
                        anchor_pos = text_lower.find(matched_anchor)
                        entity_pos = entity_match.start()
                        if abs(entity_pos - anchor_pos) < 70:
                            is_direct_claim = True
                    
                    # Direct authority patterns that inherently carry representation
                    inherent_claims = [
                        r"calling\s+from",
                        r"this\s+is\s+(?:officer|inspector|agent|deputy)",
                        r"police\s+here",
                        r"from\s+cyber\s+crime",
                        r"from\s+(?:the\s+)?bank",
                        r"on\s+behalf\s+of"
                    ]
                    for ic in inherent_claims:
                        if re.search(r"\b" + ic + r"\b", text_lower):
                            is_direct_claim = True
                            break

                    detected_entity = entity["canonical"]
                    detected_authority = auth_type
                    break
            if detected_entity and is_direct_claim:
                break
        if detected_entity and is_direct_claim:
            break

    has_claim = bool(detected_entity and is_direct_claim)

    if has_claim:
        confidence = 0.85
        if matched_anchor and detected_role:
            confidence = 0.96
        elif matched_anchor or detected_role:
            confidence = 0.90
            
        signals.append(f"authority_claim_{detected_authority.lower()}")
        if detected_authority in ["FINANCIAL", "LAW_ENFORCEMENT"]:
            signals.append("high_stakes_authority_representation")
    else:
        confidence = 0.0

    return {
        "has_claim": has_claim,
        "claimed_entity": detected_entity if has_claim else None,
        "authority_type": detected_authority if has_claim else None,
        "claimed_role": detected_role if has_claim else None,
        "confidence": round(confidence, 4),
        "raw_claim_text": matched_anchor if has_claim else None,
        "signals": signals
    }
