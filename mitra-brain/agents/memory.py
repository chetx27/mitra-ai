import os
from mem0 import AsyncMemoryClient

client = AsyncMemoryClient(api_key=os.environ["MEM0_API_KEY"])


async def retrieve_memories(profile_id: str, transcript: str) -> list[str]:
    try:
        results = await client.search(
            query=transcript,
            user_id=profile_id,
            limit=5,
        )
        return [r["memory"] for r in results if r.get("memory")]
    except Exception:
        return []


async def save_memory(profile_id: str, transcript: str, response: str) -> None:
    try:
        await client.add(
            messages=[
                {"role": "user", "content": transcript},
                {"role": "assistant", "content": response},
            ],
            user_id=profile_id,
        )
    except Exception:
        pass
