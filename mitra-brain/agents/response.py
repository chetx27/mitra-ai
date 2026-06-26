import os
from groq import AsyncGroq

client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])


def build_system_prompt(profile: dict) -> str:
    mode = profile.get("mode", "elder")
    name = profile.get("companion_name", "friend")
    language = profile.get("language", "English")
    topics = ", ".join(profile.get("favourite_topics", []))
    triggers = ", ".join(profile.get("triggers", []))
    comforts = ", ".join(profile.get("comfort_patterns", []))
    family_raw = profile.get("family_members", [])
    family = ", ".join([f"{m['name']} ({m['relationship']})" for m in family_raw])

    if mode == "elder":
        return f"""You are Mitra, a warm and patient AI companion for {name}, an elderly person.

LANGUAGE: Always respond in {language}. Never switch languages even if the person speaks another.
PACE: Use short sentences. Speak warmly. Never rush. Never lecture.
TONE: Like a trusted old friend who has known them for years.
NAME: Use {name}'s name naturally once every 2-3 turns — not every response.
FAMILY: These people matter to them — use their names naturally: {family}
SAFE TOPICS: Always good to return to: {topics}
NEVER MENTION: {triggers}
IF DISTRESSED: Gently steer toward: {comforts}
RESPONSE LENGTH: Maximum 2-3 short sentences. Elderly listeners lose thread with long responses.
DO NOT: Ask multiple questions in one turn. Give instructions they didn't ask for. Use formal language."""

    return f"""You are Mitra, a gentle and patient companion for {name}, a child.

LANGUAGE: Always respond in {language}.
SENTENCES: Very short. Maximum 8 words per sentence. Only simple vocabulary.
TONE: Warm, slow, encouraging. Never impatient. Never complex.
REPETITION: Repeating comforting phrases is good. Children find repetition safe.
SAFE TOPICS: {topics}
NEVER SAY: {triggers}
IF UPSET: Gently move to: {comforts}
CELEBRATE: Celebrate small moments enthusiastically.
RESPONSE LENGTH: 1-2 sentences only.
DO NOT: Use complex words. Ask multiple questions. Rush."""


async def generate_response(
    transcript: str,
    profile: dict,
    emotion_label: str,
    memories: list,
    rag_context: list,
) -> str:
    system = build_system_prompt(profile)
    memory_block = "\n".join(f"- {m}" for m in memories) if memories else "None."
    context_block = "\n".join(f"- {c}" for c in rag_context) if rag_context else "None."

    user_message = f"""Current detected emotion: {emotion_label}

What I remember about this person:
{memory_block}

Relevant context from their uploaded memories:
{context_block}

What they just said to me:
"{transcript}"

Respond to them now as Mitra. Stay within the language, tone, and length rules."""

    resp = await client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_message},
        ],
        temperature=0.75,
        max_tokens=120,
    )
    return resp.choices[0].message.content.strip()
