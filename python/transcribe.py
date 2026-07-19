import json
import sys
from faster_whisper import WhisperModel

video_path = sys.argv[1]

model = WhisperModel(
    "base",
    device = "cpu",
    compute_type = "int8"
)

segments, info = model.transcribe(video_path)

result = {
    "language" : info.language,
    "text" : "",
    "segments" : []
}

for segment in segments :
    result["text"] += segment.text + " "

    result["segments"].append({
        "start" : segment.start,
        "end" : segment.end,
        "text" : segment.text
    })

print(json.dumps(result))