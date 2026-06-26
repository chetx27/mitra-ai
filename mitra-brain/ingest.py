import os
import httpx
from openai import AsyncOpenAI
from db import get_db

openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
SARVAM_KEY = os.environ["SARVAM_API_KEY"]


async def embed_and_store(profile_id: str, text: str, source_type: str, source_file_url: str | None = None) -> None:
    db = get_db()
    chunk_size = 800
    overlap = 100
    chunks = []
    for i in range(0, len(text), chunk_size - overlap):
        chunk = text[i:i + chunk_size].strip()
        if chunk:
            chunks.append(chunk)

    for chunk in chunks:
        resp = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=chunk,
        )
        embedding = resp.data[0].embedding
        row = {
            "profile_id": profile_id,
            "content": chunk,
            "embedding": embedding,
            "source_type": source_type,
        }
        if source_file_url:
            row["source_file_url"] = source_file_url
        db.table("memories").insert(row).execute()


async def ingest_profile(profile_id: str) -> None:
    db = get_db()
    profile = db.table("profiles").select("*").eq("id", profile_id).single().execute().data
    if not profile:
        return

    name = profile["companion_name"]
    age = profile["age"]
    language = profile["language"]
    condition = profile.get("condition_notes", "")
    topics = ", ".join(profile.get("favourite_topics", []))
    triggers = ", ".join(profile.get("triggers", []))
    comforts = ", ".join(profile.get("comfort_patterns", []))
    family_raw = profile.get("family_members", [])
    family_lines = "\n".join([f"- {m['name']} ({m['relationship']}): {m.get('note','')}" for m in family_raw])

    text = f"""Companion profile for {name}.
Age: {age}. Primary language: {language}.
Background and context: {condition}
Favourite topics and memories: {topics}
Important people in their life:
{family_lines}
Things that upset or confuse them: {triggers}
Things that calm them when distressed: {comforts}"""

    await embed_and_store(profile_id, text, "profile_data")


async def ingest_file(profile_id: str, file_url: str, source_type: str) -> None:
    if source_type == "photo_description":
        resp = await openai.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this photo in detail for an elderly person's memory companion. Include people visible, setting, occasion if apparent, mood, and any identifying details like clothing or location. Write as if recounting a memory."},
                    {"type": "image_url", "image_url": {"url": file_url}},
                ],
            }],
            max_tokens=300,
        )
        description = resp.choices[0].message.content or ""
        await embed_and_store(profile_id, description, "photo_description", file_url)

    elif source_type == "voice_transcript":
        async with httpx.AsyncClient() as http:
            audio_resp = await http.get(file_url)
            audio_bytes = audio_resp.content
            sarvam_resp = await http.post(
                "https://api.sarvam.ai/speech-to-text",
                headers={"api-subscription-key": SARVAM_KEY},
                files={"file": ("audio.wav", audio_bytes, "audio/wav")},
                data={"model": "saarika:v2"},
            )
            transcript = sarvam_resp.json().get("transcript", "")
        if transcript:
            await embed_and_store(profile_id, transcript, "voice_transcript", file_url)

    elif source_type == "story":
        await embed_and_store(profile_id, file_url, "story")
