import json
import sys
from faster_whisper import WhisperModel

video_path = sys.argv[1]
language = sys.argv[2] if len(sys.argv) > 2 else "en"

model = WhisperModel(
    "base",
    device="cpu",
    compute_type="int8"
)

segments, info = model.transcribe(
    video_path,
    language=language,
    task="transcribe",
    beam_size=5,
    vad_filter=True
)

result = {
    "language": language,
    "text": "",
    "segments": []
}

for segment in segments:
    clean_text = segment.text.strip()

    result["text"] += clean_text + " "

    result["segments"].append({
        "start": segment.start,
        "end": segment.end,
        "text": clean_text
    })

result["text"] = result["text"].strip()

print(json.dumps(result, ensure_ascii=False))