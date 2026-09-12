with open('app/api/routes/sessions.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "speaker_result = None" in line:
        skip = True
    
    if skip and "except Exception" in line:
        # skip next line ("pass")
        continue
    if skip and "pass" in line:
        skip = False
        continue
        
    if "speaker_analysis=speaker_result," in line:
        continue
        
    if "\"speaker_analysis\": speaker_result," in line:
        new_lines.append(line.replace("\"speaker_analysis\": speaker_result,", "\"speaker_analysis\": None,"))
        continue

    if not skip:
        new_lines.append(line)

with open('app/api/routes/sessions.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
