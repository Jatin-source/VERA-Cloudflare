from transformers import VitsModel, AutoTokenizer
import torch
import scipy.io.wavfile
import numpy as np

model_name = "facebook/mms-tts-eng"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = VitsModel.from_pretrained(model_name)
text = "This is a synthetic voice to test the deepfake detection model."
inputs = tokenizer(text, return_tensors="pt")
with torch.no_grad():
    output = model(**inputs).waveform
scipy.io.wavfile.write("fake.wav", rate=model.config.sampling_rate, data=output.numpy()[0])
