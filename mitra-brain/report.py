import os
from groq import AsyncGroq
from db import get_db

client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])


async def generate_daily_report(profile_id: str, date: str) -> str:
    db = get_db()
    start = f"{date}T00:00:00"
    end = f"{date}T23:59:59"
    logs = db.table("conversation_logs") \
        .select("transcript, response, emotion_label, created_at, safety_flag") \
        .eq("profile_id", profile_id) \
        .gte("created_at", start) \
        .lte("created_at", end) \
        .order("created_at") \
        .execute().data

    if not logs:
        return "No conversations recorded today."

    emotion_counts = {}
    for log in logs:
        e = log["emotion_label"]
        emotion_counts[e] = emotion_counts.get(e, 0) + 1

    conversation_text = "\n".join([
        f"[{log['created_at'][11:16]}] Person: {log['transcript'][:100]}"
        for log in logs
    ])

    prompt = f"""You are summarising a day's conversation logs for a caregiver.
Write a warm, plain-language paragraph (3-5 sentences) describing how this person seemed today.
Include emotional tone, topics discussed, any notable moments, and overall wellbeing.
Do not use clinical language. Write as if speaking to a family member.

Emotion summary: {emotion_counts}
Total conversations: {len(logs)}

Conversation excerpts:
{conversation_text[:2000]}

Write the summary now:"""

    resp = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=200,
    )
    return resp.choices[0].message.content.strip()
