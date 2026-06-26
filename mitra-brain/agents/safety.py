import os
import json
from groq import AsyncGroq
from db import save_alert
from alerts import send_whatsapp_alert

client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

CRISIS_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "fallen down", "fell down",
    "don't want to live", "want to die", "end my life", "nobody cares",
    "emergency", "help me", "i'm scared", "very scared",
]

SYSTEM = """You are a safety classifier for an AI companion for elderly people and children.
Given a transcript and emotion label, determine if there is a safety concern.

Respond with ONLY valid JSON:
{"flag": true, "severity": "emergency", "reason": "brief reason"}
or
{"flag": false}

Severity levels:
- emergency: immediate physical danger, acute crisis, medical emergency
- moderate: significant emotional distress, repeated sadness, confusion
- info: mild concern worth noting to caregiver"""


async def check_safety(
    transcript: str,
    emotion_label: str,
    profile_id: str,
) -> tuple[bool, str]:
    lower = transcript.lower()
    is_keyword_match = any(kw in lower for kw in CRISIS_KEYWORDS)

    if not is_keyword_match and emotion_label not in ("distressed", "anxious"):
        return False, ""

    try:
        resp = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Emotion: {emotion_label}\nTranscript: {transcript}"},
            ],
            temperature=0.1,
            max_tokens=80,
        )
        data = json.loads(resp.choices[0].message.content.strip())
        if data.get("flag"):
            severity = data.get("severity", "moderate")
            await save_alert(
                profile_id=profile_id,
                severity=severity,
                transcript_excerpt=transcript[:200],
                emotion_label=emotion_label,
            )
            await send_whatsapp_alert(profile_id, transcript[:200], severity)
            return True, severity
        return False, ""
    except Exception:
        if is_keyword_match:
            await save_alert(profile_id, "moderate", transcript[:200], emotion_label)
            return True, "moderate"
        return False, ""
