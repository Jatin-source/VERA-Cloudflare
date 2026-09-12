import pytest
import numpy as np
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from tests.test_audio import create_dummy_wav

client = TestClient(app)

@patch("app.services.speaker_verification_service.extract_embedding")
def test_enroll_voice_profile(mock_extract):
    # Mock embedding return
    mock_extract.return_value = np.random.rand(1, 512).astype(np.float32)
    
    wav_bytes = create_dummy_wav()
    files = {"file": ("trusted_voice.wav", wav_bytes, "audio/wav")}
    data = {"user_id": "user_123"}
    
    resp = client.post("/api/v1/voice-profiles", data=data, files=files)
    assert resp.status_code == 201
    
    resp_data = resp.json()
    assert resp_data["user_id"] == "user_123"
    assert "profile_id" in resp_data
    assert resp_data["model_name"] == "anton-l/wav2vec2-base-superb-sv"
    
    # Store for next test
    return resp_data["profile_id"]

def test_get_voice_profile():
    # Enroll first to ensure we have a profile to get
    with patch("app.services.speaker_verification_service.extract_embedding") as mock_extract:
        mock_extract.return_value = np.random.rand(1, 512).astype(np.float32)
        wav_bytes = create_dummy_wav()
        resp = client.post(
            "/api/v1/voice-profiles", 
            data={"user_id": "user_123"}, 
            files={"file": ("trusted_voice.wav", wav_bytes, "audio/wav")}
        )
        profile_id = resp.json()["profile_id"]
        
    # Get profile
    resp2 = client.get(f"/api/v1/voice-profiles/{profile_id}")
    assert resp2.status_code == 200
    resp2_data = resp2.json()
    assert resp2_data["profile_id"] == profile_id
    assert resp2_data["user_id"] == "user_123"
    assert "embedding" not in resp2_data # Ensure raw embedding isn't leaked
