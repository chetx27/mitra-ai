import os
import json
from groq import AsyncGroq

client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

SYSTEM = """You are an emotion classifier. Given a conversational transcript, classify the speaker's emotional state into exactly one of: calm, happy, anxious, sad, distressed.

Respond with ONLY valid JSON in this exact format:
{"label": "calm", "confidence": 0.85}

Labels:
- calm: peaceful, neutral, content
- happy: joyful, excited, positive
- anxious: worried, nervous, restless
- sad: sorrowful, low energy, missing someone
- distressed: significant emotional pain, fear, crisis language, mentions of physical harm or not wanting to continue"""


async def classify_emotion(transcript: str) -> tuple[str, float]:
    try:
        resp = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": SYSTEM},
                {"role": "user", "content": f"Transcript: {transcript}"},
            ],
            temperature=0.1,
            max_tokens=40,
        )
        data = json.loads(resp.choices[0].message.content.strip())
        label = data.get("label", "calm")
        confidence = float(data.get("confidence", 0.5))
        if label not in ("calm", "happy", "anxious", "sad", "distressed"):
            label = "calm"
        return label, confidence
    except Exception:
        return "calm", 0.5
