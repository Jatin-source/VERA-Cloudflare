import librosa
import numpy as np
from app.services.voice_integrity_service import analyze_voice
audio, sr = librosa.load('dummy.flac', sr=16000)
print(analyze_voice(audio, sr))
