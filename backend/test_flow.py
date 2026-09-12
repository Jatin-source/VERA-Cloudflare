import sys
from app.services.intent_service import analyze_intent
from app.services.action_context_service import analyze_action_context

transcript = "This is an urgent security alert. Please share the OTP you just received and transfer the money to this account immediately. Do not tell anyone about this transaction."
intent = analyze_intent(transcript)
print("Intent:", intent)
action = analyze_action_context(transcript, intent)
print("Action:", action)
