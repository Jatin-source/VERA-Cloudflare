import pytest
import json
import base64
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from tests.test_audio import create_dummy_wav

client = TestClient(app)

def test_websocket_invalid_session():
    with pytest.raises(Exception):
        with client.websocket_connect("/api/v1/ws/sessions/invalid-session"):
            pass

@patch("app.services.voice_integrity_service.analyze_voice")
@patch("app.services.asr_service.transcribe_audio")
def test_websocket_processing(mock_transcribe, mock_analyze):
    mock_analyze.return_value = {"voice_integrity_score": 0.1, "confidence": 0.9}
    mock_transcribe.return_value = {"transcript": "hello this is a test", "language": "en"}
    
    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]
    
    with client.websocket_connect(f"/api/v1/ws/sessions/{session_id}") as websocket:
        dummy_wav = create_dummy_wav()
        large_payload = dummy_wav * (150000 // len(dummy_wav) + 1)
        
        websocket.send_bytes(large_payload)
        
        data = websocket.receive_json()
        
        assert "error" not in data or "Audio parsing" in data.get("error", "")
        if "error" not in data:
            assert data["session_id"] == session_id
            assert data["transcript"] == "hello this is a test"
            assert data["decision"] in ["allow", "warn", "verify", "block"]
            assert data["risk_level"] in ["low", "medium", "high", "critical"]
            assert "voice_integrity_score" in data

@patch("app.services.voice_integrity_service.analyze_voice")
@patch("app.services.asr_service.transcribe_audio")
def test_websocket_chunk_processing(mock_transcribe, mock_analyze):
    # Test valid chunk, multiple sequential, duplicate, out-of-order, malformed/empty, risk persistence
    
    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]
    
    dummy_wav = create_dummy_wav()
    audio_b64 = base64.b64encode(dummy_wav).decode("utf-8")
    
    with client.websocket_connect(f"/api/v1/ws/sessions/{session_id}") as websocket:
        # 1. receiving one valid chunk
        mock_analyze.return_value = {"state": "SPEECH_DETECTED", "ai_voice_probability": 0.03, "voice_integrity_score": 0.97, "confidence": 0.9}
        mock_transcribe.return_value = {"transcript": "hello", "language": "en"}
        
        websocket.send_json({
            "chunk_id": 1,
            "audio_data": audio_b64
        })
        
        data = websocket.receive_json()
        assert "error" not in data
        assert data["chunk_id"] == 1
        assert data["risk_level"] == "low"
        
        # 2. receiving multiple sequential chunks (chunk 2)
        # We will make this chunk highly suspicious so risk goes to CRITICAL
        mock_analyze.return_value = {"state": "SPEECH_DETECTED", "ai_voice_probability": 0.95, "voice_integrity_score": 0.05, "confidence": 0.9} # High AI voice
        mock_transcribe.return_value = {"transcript": "urgent share otp and transfer money", "language": "en"}
        
        websocket.send_json({
            "chunk_id": 2,
            "audio_data": audio_b64
        })
        
        data = websocket.receive_json()
        assert "error" not in data
        assert data["chunk_id"] == 2
        assert data["risk_level"] == "critical"
        
        # 3. session risk persistence
        # Next chunk is completely benign, but risk should stay CRITICAL
        mock_analyze.return_value = {"state": "SPEECH_DETECTED", "ai_voice_probability": 0.03, "voice_integrity_score": 0.97, "confidence": 0.9}
        mock_transcribe.return_value = {"transcript": "hello", "language": "en"}
        
        websocket.send_json({
            "chunk_id": 3,
            "audio_data": audio_b64
        })
        
        data = websocket.receive_json()
        assert "error" not in data
        assert data["chunk_id"] == 3
        assert data["risk_level"] == "critical" # PERSISTED!
        
        # 4. duplicate chunk handling
        websocket.send_json({
            "chunk_id": 2,
            "audio_data": audio_b64
        })
        data = websocket.receive_json()
        assert "error" in data
        assert "Duplicate chunk_id" in data["error"]
        
        # 5. out-of-order chunk handling (chunk 0)
        # Should process it normally (unless explicitly dropped, but our impl accepts it)
        websocket.send_json({
            "chunk_id": 0,
            "audio_data": audio_b64
        })
        data = websocket.receive_json()
        assert "error" not in data
        assert data["chunk_id"] == 0
        assert data["risk_level"] == "critical" # Still critical
        
        # 6. malformed metadata
        websocket.send_text("not a json")
        data = websocket.receive_json()
        assert "error" in data
        assert "Malformed" in data["error"]
        
        websocket.send_json({
            "chunk_id": 4
            # missing audio_data
        })
        data = websocket.receive_json()
        assert "error" in data
        assert "Missing audio_data" in data["error"]
        
        websocket.send_json({
            # missing chunk_id
            "audio_data": audio_b64
        })
        data = websocket.receive_json()
        assert "error" in data
        assert "Missing chunk_id" in data["error"]
        
        # 7. empty/invalid chunk handling
        websocket.send_json({
            "chunk_id": 5,
            "audio_data": "notbase64!@#"
        })
        data = websocket.receive_json()
        assert "error" in data
        assert "Invalid base64 encoding" in data["error"]

def test_websocket_disconnect():
    # Test WebSocket disconnect gracefully
    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]
    
    with client.websocket_connect(f"/api/v1/ws/sessions/{session_id}") as websocket:
        websocket.close()
    # If no exception is raised, the server handled the disconnect gracefully
    assert True

@patch("app.services.voice_integrity_service.analyze_voice")
@patch("app.services.asr_service.transcribe_audio")
def test_websocket_identity_claim_pipeline(mock_transcribe, mock_analyze):
    mock_analyze.return_value = {"state": "SPEECH_DETECTED", "ai_voice_probability": 0.04, "voice_integrity_score": 0.96, "confidence": 0.9}
    
    resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
    session_id = resp.json()["session_id"]
    dummy_wav = create_dummy_wav()
    audio_b64 = base64.b64encode(dummy_wav).decode("utf-8")
    
    with client.websocket_connect(f"/api/v1/ws/sessions/{session_id}") as websocket:
        # Chunk 1: Caller begins identity representation anchor
        mock_transcribe.return_value = {"transcript": "Hello, I am calling from", "language": "en"}
        websocket.send_json({"chunk_id": 1, "audio_data": audio_b64})
        data1 = websocket.receive_json()
        assert "identity_claim" in data1
        
        # Chunk 2: Sentence continues across boundary: "State Bank of India fraud department"
        mock_transcribe.return_value = {"transcript": "State Bank of India fraud department", "language": "en"}
        websocket.send_json({"chunk_id": 2, "audio_data": audio_b64})
        data2 = websocket.receive_json()
        assert "identity_claim" in data2
        assert data2["identity_claim"]["has_claim"] is True
        assert data2["identity_claim"]["authority_type"] == "FINANCIAL"
        assert "State Bank of India" in data2["identity_claim"]["claimed_entity"]
        assert data2["decision"] in ["verify", "block"]

