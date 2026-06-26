import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_client: Client | None = None


def get_db() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


async def get_profile(profile_id: str) -> dict:
    db = get_db()
    result = db.table("profiles").select("*").eq("id", profile_id).single().execute()
    if not result.data:
        raise ValueError(f"Profile {profile_id} not found")
    return result.data


async def save_conversation_log(
    profile_id: str,
    transcript: str,
    response: str,
    emotion_label: str,
    emotion_confidence: float,
    safety_flag: bool,
    rag_chunks: list,
    mem0_memories: list,
) -> None:
    db = get_db()
    db.table("conversation_logs").insert({
        "profile_id": profile_id,
        "transcript": transcript,
        "response": response,
        "emotion_label": emotion_label,
        "emotion_confidence": emotion_confidence,
        "safety_flag": safety_flag,
        "rag_chunks_used": rag_chunks,
        "mem0_memories_used": mem0_memories,
    }).execute()


async def save_alert(
    profile_id: str,
    severity: str,
    transcript_excerpt: str,
    emotion_label: str,
) -> None:
    db = get_db()
    db.table("alerts").insert({
        "profile_id": profile_id,
        "severity": severity,
        "transcript_excerpt": transcript_excerpt,
        "emotion_label": emotion_label,
        "resolved": False,
    }).execute()
