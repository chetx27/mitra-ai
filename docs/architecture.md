# Mitra — Architecture Deep-Dive

## Philosophy

Mitra's architecture is driven by three constraints specific to its users:

1. **Latency must be invisible.** An elderly person speaking into a device cannot wait more than 2-3 seconds for a reply. The brain pipeline is designed to be under 1.5s end-to-end on a warm Groq connection.
2. **Cost must be controlled.** The safety agent uses a two-stage gate — keyword scan first, LLM only if needed — to avoid unnecessary inference costs on the vast majority of safe conversations.
3. **Context must feel human.** A companion that forgets everything each conversation is useless. The Mem0 memory layer and pgvector RAG together ensure Mitra always has rich context about the person.

---

## LangGraph Pipeline

The pipeline is a directed acyclic graph (DAG) compiled with LangGraph:

```
load_profile
     │
     ▼
  emotion               ← Groq llama-3.1-8b-instant (~150ms)
     │
     ▼
  memory                ← Mem0 semantic search
     │
     ▼
   rag                  ← Supabase pgvector cosine search
     │
     ▼
response_and_safety     ← asyncio.gather() — both run in parallel
     │
    END
```

### Why serial for emotion → memory → rag?

Memory and RAG retrieval are semantically guided by the transcript, but the **system prompt** for response generation depends on the emotion label. Running emotion first means the response agent always knows the emotional state. Memory and RAG are then serial because they're lightweight async I/O (not compute-bound), and their combined latency is typically <200ms.

### Why parallel for response + safety?

Response generation (Groq 70B) takes ~700ms. Safety check (Groq 8B) takes ~150ms. Running them in parallel saves ~150ms on every flagged conversation. On safe conversations, the safety agent returns immediately after the keyword scan (no LLM call needed).

---

## Mem0 vs pgvector — When Each Is Used

| | Mem0 | pgvector (RAG) |
|--|------|----------------|
| **What it stores** | Conversation-derived episodic memories | Family-uploaded content |
| **Updated by** | Every conversation turn automatically | Caregiver uploads via `/ingest/file` |
| **Retrieval** | Mem0's own semantic search | Supabase `match_memories` SQL function |
| **Best for** | "I know you've been worried about your daughter" | "Your grandson Arjun just started school" |
| **Managed by** | Mem0 cloud | Supabase Storage + pgvector |

In production, both are injected into the response context block:

```
What I remember about this person:
- [Mem0 memory 1]
- [Mem0 memory 2]

Relevant context from their uploaded memories:
- [pgvector chunk 1 — from a family photo]
- [pgvector chunk 2 — from a voice clip]
```

---

## Embedding Pipeline (ingest.py)

When a caregiver uploads a file, three different paths are taken:

### Photo Description Path
```
Upload photo to Supabase Storage
        │
        ▼
POST /ingest/file {source_type: "photo_description"}
        │
        ▼
GPT-4o vision: "Describe this photo as a memory for an elderly person's companion"
        │
        ▼
text-embedding-3-small → 1536-dim vector
        │
        ▼
INSERT into memories table (supabase pgvector)
```

### Voice Clip Path
```
Upload .wav/.mp3 to Supabase Storage
        │
        ▼
POST /ingest/file {source_type: "voice_transcript"}
        │
        ▼
Sarvam saarika:v2 → transcript text
        │
        ▼
text-embedding-3-small → 1536-dim vector
        │
        ▼
INSERT into memories table
```

### Written Story Path
```
Caregiver types story in Upload Center
        │
        ▼
POST /ingest/file {source_type: "story"}
        │
        ▼
Chunk text (800 chars, 100-char overlap)
        │
        ▼
text-embedding-3-small for each chunk
        │
        ▼
INSERT each chunk into memories table
```

### Profile Ingestion
Profile data is embedded on first onboarding and re-embedded when the profile is updated:

```
POST /ingest/profile
        │
        ▼
Flatten profile → structured text block
        │
        ▼
text-embedding-3-small → vector
        │
        ▼
INSERT into memories (source_type: "profile_data")
```

---

## Response Agent — Dual System Prompt Design

The response agent uses entirely different system prompts for elder vs child modes. This is not cosmetic — the constraints are fundamentally different.

### Elder Mode Design Principles
- **Language lock**: Always respond in the profile language, even if the elder switches mid-conversation (they often do — it's natural code-switching, not a request to change languages)
- **No multiple questions**: Elderly listeners, especially those with mild cognitive decline, lose thread when asked two things at once
- **Name usage**: Use the person's name every 2–3 turns to feel natural, not robotic ("Yes, of course." vs "Yes of course, Amma.")
- **Family anchoring**: Family names (grandchildren, siblings) are powerful memory anchors — use them when relevant
- **Max 2–3 sentences**: Long responses cause anxiety, not engagement

### Child Mode Design Principles
- **8-word sentence cap**: Children with communication difficulties need micro-chunks
- **Repetition is comfort**: Unlike adult conversation where repetition is awkward, for neurodivergent children, predictable phrases are safe
- **Never complex vocabulary**: The system prompt explicitly bans abstract language
- **Celebrate micro-moments**: "That's wonderful!" for ordinary statements — enthusiasm signals safety

---

## Safety Agent — Two-Stage Gate

```
Receive {transcript, emotion_label, profile_id}
        │
        ▼
Stage 1: Keyword scan (no LLM, ~0ms)
        │
        ├── No keyword match AND emotion is calm/happy
        │         └── return (False, "")  ← fast exit, no cost
        │
        └── Keyword match OR emotion is distressed/anxious
                  │
                  ▼
        Stage 2: Groq 8B safety classifier
                  │
                  ├── flag=false → return (False, "")
                  │
                  └── flag=true
                            │
                            ├── save_alert() to Supabase
                            ├── send_whatsapp_alert() via Twilio
                            └── return (True, severity)
```

**Design decision: why not just use the LLM always?**

On 95%+ of conversations, there is no safety concern. Running an LLM call for every single turn would add latency and cost with no benefit. The keyword scan catches the obvious cases instantly, and the LLM is reserved for edge cases (anxious emotion but ambiguous transcript, or keyword match that might be innocuous in context).

**Design decision: why not block the response while checking safety?**

Mitra should not hesitate or go silent when someone might be in distress — that would be alarming. The response and safety agents run in parallel. Mitra speaks its normal, warm reply immediately. The alert fires silently. From the user's perspective, nothing changes.

---

## Silence Detection Algorithm

The device uses an amplitude-based VAD (Voice Activity Detection) to determine when the user has finished speaking:

```python
SILENCE_THRESHOLD = 0.008   # ~-42 dBFS
SILENCE_DURATION_SECS = 1.8
CHUNK_SIZE = 512            # frames per PyAudio read

# Per chunk: compute mean absolute amplitude of int16 samples
amp = np.abs(np.frombuffer(data, np.int16).astype(np.float32) / 32768.0).mean()

# Count consecutive silent chunks
if amp < SILENCE_THRESHOLD:
    silent += 1
else:
    silent = 0  # reset on any sound

# Stop when silence persists for 1.8 seconds
max_silent = int(SILENCE_DURATION_SECS * SAMPLE_RATE / CHUNK_SIZE)
# = int(1.8 * 16000 / 512) = 56 chunks
```

**Why 1.8 seconds?** Elderly speakers and children often pause mid-sentence. 1.0s was too aggressive (cut off mid-thought). 2.5s felt unresponsive. 1.8s was empirically the best trade-off.

**Minimum recording length**: 0.5 seconds (`min_frames`) prevents single-word captures when the wake word trails off.

---

## Supabase IVFFlat Index

The `memories` table uses an IVFFlat index for approximate nearest-neighbor (ANN) search:

```sql
create index on memories using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

**`lists = 100`**: With 100 lists, a query probes approximately `sqrt(100) = 10` lists by default, giving ~1% of the full table scan cost with >95% recall. This is appropriate for tables up to ~100K rows. For larger deployments, consider `lists = 1000` and `ivfflat.probes = 20`.

**Cosine vs L2?** We use cosine similarity (`vector_cosine_ops`) because embeddings from `text-embedding-3-small` are unit-normalized — cosine and L2 are equivalent in this case, but cosine is semantically cleaner.
