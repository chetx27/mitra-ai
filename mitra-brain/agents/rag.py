import os
from openai import AsyncOpenAI
from db import get_db

openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


async def embed(text: str) -> list[float]:
    resp = await openai.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    return resp.data[0].embedding


async def retrieve_context(profile_id: str, transcript: str) -> list[str]:
    try:
        query_embedding = await embed(transcript)
        db = get_db()
        result = db.rpc("match_memories", {
            "query_embedding": query_embedding,
            "match_profile_id": profile_id,
            "match_count": 3,
        }).execute()
        return [row["content"] for row in (result.data or [])]
    except Exception:
        return []
