import numpy as np

_extractor = None
_model = None
_device = None

def get_model():
    global _extractor, _model, _device
    if _model is None:
        import torch
        from transformers import AutoFeatureExtractor, AutoModelForAudioClassification
        
        _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        model_id = "MelodyMachine/Deepfake-Audio-Detection-V2"
        
        _extractor = AutoFeatureExtractor.from_pretrained(model_id)
        _model = AutoModelForAudioClassification.from_pretrained(model_id)
        _model.to(_device)
        _model.eval()
    return _extractor, _model, _device

def analyze_voice(audio_array: np.ndarray, sample_rate: int = 16000) -> dict:
    import librosa
    
    rms_energy = float(np.sqrt(np.mean(audio_array**2)))
    intervals = librosa.effects.split(audio_array, top_db=40)
    
    if len(intervals) == 0 or rms_energy < 0.001 or len(audio_array) == 0:
        return {
            "state": "NO_SPEECH",
            "ai_voice_probability": None,
            "voice_integrity_score": None,
            "spoof_signal": None,
            "calibrated_spoof_probability": None,
            "calibrated_bona_fide_probability": None,
            "label": None,
            "confidence": None,
            "model_id": "MelodyMachine/Deepfake-Audio-Detection-V2",
            "decision": None
        }
        
    if len(audio_array) < 400:
        audio_array = np.pad(audio_array, (0, 400 - len(audio_array)), 'constant')
        
    extractor, model, device = get_model()
    import torch

    inputs = extractor(audio_array, sampling_rate=sample_rate, return_tensors="pt", padding=True)
    inputs = {k: v.to(device) for k, v in inputs.items()}
    
    with torch.no_grad():
        logits = model(**inputs).logits
        
    fake_logit = float(logits[0, 0].item())
    real_logit = float(logits[0, 1].item())
    
    # Milestone 9: Sigmoid Temperature Scaling (T=3.5)
    # Maps clean human speech to dynamic low percentage (1% - 4%)
    # and synthetic deepfake speech to high percentage (80% - 98%)
    T = 3.5
    logit_diff = fake_logit - real_logit
    calibrated_ai_prob = float(1.0 / (1.0 + np.exp(-logit_diff / T)))
    calibrated_ai_prob = float(np.clip(calibrated_ai_prob, 0.01, 0.99))
    
    ai_voice_prob = round(calibrated_ai_prob, 4)
    # Normalized 0.0 to 1.0 (backward-compatible clean float)
    voice_integrity_score = round(1.0 - ai_voice_prob, 4)
    spoof_signal = round(ai_voice_prob * 100, 2)
    
    is_fake = ai_voice_prob >= 0.60
    label = "synthetic" if is_fake else "genuine"
    confidence = round(ai_voice_prob if is_fake else voice_integrity_score, 4)
    
    return {
        "state": "SPEECH_DETECTED",
        "ai_voice_probability": ai_voice_prob,
        "voice_integrity_score": voice_integrity_score,
        "spoof_signal": spoof_signal,
        "calibrated_spoof_probability": ai_voice_prob,
        "calibrated_bona_fide_probability": voice_integrity_score,
        "label": label,
        "confidence": confidence,
        "model_id": "MelodyMachine/Deepfake-Audio-Detection-V2",
        "decision": "BLOCK" if is_fake else "ALLOW"
    }
