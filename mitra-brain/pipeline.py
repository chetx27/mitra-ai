import asyncio
from typing import TypedDict
from langgraph.graph import StateGraph, END
from agents.emotion import classify_emotion
from agents.memory import retrieve_memories, save_memory
from agents.rag import retrieve_context
from agents.response import generate_response
from agents.safety import check_safety
from db import get_profile, save_conversation_log


class MitraState(TypedDict):
    profile_id: str
    transcript: str
    profile: dict
    emotion_label: str
    emotion_confidence: float
    retrieved_memories: list
    rag_context: list
    response: str
    safety_flag: bool


async def node_load_profile(state: MitraState) -> dict:
    profile = await get_profile(state["profile_id"])
    return {"profile": profile}


async def node_emotion(state: MitraState) -> dict:
    label, confidence = await classify_emotion(state["transcript"])
    return {"emotion_label": label, "emotion_confidence": confidence}


async def node_memory(state: MitraState) -> dict:
    memories = await retrieve_memories(state["profile_id"], state["transcript"])
    return {"retrieved_memories": memories}


async def node_rag(state: MitraState) -> dict:
    chunks = await retrieve_context(state["profile_id"], state["transcript"])
    return {"rag_context": chunks}


async def node_response_and_safety(state: MitraState) -> dict:
    response_task = generate_response(
        transcript=state["transcript"],
        profile=state["profile"],
        emotion_label=state["emotion_label"],
        memories=state["retrieved_memories"],
        rag_context=state["rag_context"],
    )
    safety_task = check_safety(
        transcript=state["transcript"],
        emotion_label=state["emotion_label"],
        profile_id=state["profile_id"],
    )
    response, (safety_flag, _severity) = await asyncio.gather(response_task, safety_task)

    await save_memory(state["profile_id"], state["transcript"], response)
    await save_conversation_log(
        profile_id=state["profile_id"],
        transcript=state["transcript"],
        response=response,
        emotion_label=state["emotion_label"],
        emotion_confidence=state["emotion_confidence"],
        safety_flag=safety_flag,
        rag_chunks=state["rag_context"],
        mem0_memories=state["retrieved_memories"],
    )
    return {"response": response, "safety_flag": safety_flag}


def build():
    g = StateGraph(MitraState)
    g.add_node("load_profile", node_load_profile)
    g.add_node("emotion", node_emotion)
    g.add_node("memory", node_memory)
    g.add_node("rag", node_rag)
    g.add_node("response_and_safety", node_response_and_safety)
    g.set_entry_point("load_profile")
    g.add_edge("load_profile", "emotion")
    g.add_edge("emotion", "memory")
    g.add_edge("memory", "rag")
    g.add_edge("rag", "response_and_safety")
    g.add_edge("response_and_safety", END)
    return g.compile()


_pipeline = build()


async def run_pipeline(profile_id: str, transcript: str) -> MitraState:
    return await _pipeline.ainvoke({
        "profile_id": profile_id,
        "transcript": transcript,
        "profile": {},
        "emotion_label": "calm",
        "emotion_confidence": 0.0,
        "retrieved_memories": [],
        "rag_context": [],
        "response": "",
        "safety_flag": False,
    })
