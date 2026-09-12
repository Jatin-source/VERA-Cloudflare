import json

def test_json():
    print(json.loads('{"chunk_id": 1, "audio_data": "SGVsbG8="}'))

test_json()
