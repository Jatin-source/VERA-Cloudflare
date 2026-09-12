import pytest
from fastapi.testclient import TestClient
from app.main import app
from tests.test_audio import create_dummy_wav

client = TestClient(app)

from unittest.mock import patch

def test_verify_voice_success():
    with patch("app.services.voice_integrity_service.analyze_voice") as mock_analyze:
        mock_analyze.return_value = {
            "voice_integrity_score": 0.85,
            "label": "synthetic",
            "model_name": "MelodyMachine/Deepfake-Audio-Detection-V2",
            "confidence": 0.85
        }
        
        resp = client.post("/api/v1/sessions", json={"caller_id": "test_caller"})
        assert resp.status_code == 201
        session_id = resp.json()["session_id"]
        
        wav_bytes = create_dummy_wav()
        files = {"file": ("test_voice.wav", wav_bytes, "audio/wav")}
        
        resp2 = client.post(f"/api/v1/sessions/{session_id}/verify", files=files)
        assert resp2.status_code == 200
        body = resp2.json()
        
        assert body["session_id"] == session_id
        assert body["status"] == "success"
        data = body["data"]
        assert data["filename"] == "test_voice.wav"
        assert "voice_integrity" in data
        
        vi = data["voice_integrity"]
        assert "voice_integrity_score" in vi
        assert 0.0 <= vi["voice_integrity_score"] <= 1.0
        assert vi["label"] in ["genuine", "synthetic"]
        assert vi["model_name"] == "MelodyMachine/Deepfake-Audio-Detection-V2"
        assert vi["confidence"] == 0.85

def test_verify_voice_invalid_session():
    wav_bytes = create_dummy_wav()
    files = {"file": ("test.wav", wav_bytes, "audio/wav")}
    
    resp = client.post("/api/v1/sessions/invalid-session/verify", files=files)
    assert resp.status_code == 404

import numpy as np
import torch
from unittest.mock import patch, MagicMock
from app.services.voice_integrity_service import analyze_voice

def test_analyze_voice_mapping_genuine():
    with patch('app.services.voice_integrity_service.get_model') as mock_get_model:
        mock_extractor = MagicMock(return_value={'input_values': torch.tensor([[0.0]])})
        
        mock_model = MagicMock()
        mock_logits = torch.tensor([[5.0, -5.0]]) # [0]=high (real), [1]=low (fake)
        mock_model.return_value.logits = mock_logits
        
        mock_device = torch.device('cpu')
        mock_get_model.return_value = (mock_extractor, mock_model, mock_device)
        
        audio = np.zeros(16000, dtype=np.float32)
        result = analyze_voice(audio, 16000)
        
        assert result['label'] == 'genuine'
        assert result['voice_integrity_score'] < 0.5
        assert result['confidence'] > 0.9

def test_analyze_voice_mapping_synthetic():
    with patch('app.services.voice_integrity_service.get_model') as mock_get_model:
        mock_extractor = MagicMock(return_value={'input_values': torch.tensor([[0.0]])})
        
        mock_model = MagicMock()
        mock_logits = torch.tensor([[-5.0, 5.0]]) # [0]=low (real), [1]=high (fake)
        mock_model.return_value.logits = mock_logits
        
        mock_device = torch.device('cpu')
        mock_get_model.return_value = (mock_extractor, mock_model, mock_device)
        
        audio = np.zeros(16000, dtype=np.float32)
        result = analyze_voice(audio, 16000)
        
        assert result['label'] == 'synthetic'
        assert result['voice_integrity_score'] > 0.5
        assert result['confidence'] > 0.9
