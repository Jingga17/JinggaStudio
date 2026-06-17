import json
import sys

transcript_path = r"C:\Users\LENOVO\.gemini\antigravity-ide\brain\5986ac45-d17f-4ac2-adae-ff8b38a8e49a\.system_generated\logs\transcript.jsonl"
try:
    with open(transcript_path, 'r', encoding='utf-8') as f:
        for line in f:
            if "switchPemetaanTab(tabId)" in line and "replace_file_content" in line:
                data = json.loads(line)
                if "tool_calls" in data:
                    for call in data["tool_calls"]:
                        if call["name"] == "replace_file_content":
                            args = call["args"]
                            if "ReplacementContent" in args:
                                print(args["ReplacementContent"])
except Exception as e:
    print(e)
