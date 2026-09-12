import numpy as np

def get_model():
    # Speaker model no longer loaded
    return None, None, None

def extract_embedding(audio_array: np.ndarray, sample_rate: int = 16000) -> np.ndarray:
    # Dummy embedding for API compatibility
    return np.zeros((1, 512), dtype=np.float32)
