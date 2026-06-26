<div align="center">

<img src="docs/assets/mitra-banner.svg" alt="Mitra — AI Companion" width="800"/>

# 🤝 Mitra — AI Companion for Elders & Children

**A voice-first, emotionally-aware AI companion built for elderly people and neurodivergent children.**  
Speaks 10+ Indian languages · Detects distress silently · Alerts caregivers instantly · Runs on a Raspberry Pi.

[![License: MIT](https://img.shields.io/badge/License-MIT-6366f1.svg)](LICENSE)
[![Python](https://img.shields.io/badge/Python-3.11+-3b82f6.svg)](https://python.org)
[![React](https://img.shields.io/badge/React-18+-06b6d4.svg)](https://react.dev)
[![LangGraph](https://img.shields.io/badge/LangGraph-Orchestrator-8b5cf6.svg)](https://langchain-ai.github.io/langgraph/)
[![Groq](https://img.shields.io/badge/Groq-Llama--3-f97316.svg)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector-10b981.svg)](https://supabase.com)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0f172a.svg)](https://railway.app)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000.svg)](https://vercel.com)

</div>

---

## 📖 Table of Contents

- [What is Mitra?](#-what-is-mitra)
- [Architecture Overview](#-architecture-overview)
- [System Layers](#-system-layers)
  - [Layer 1 — Physical Device (Raspberry Pi)](#layer-1--physical-device-raspberry-pi)
  - [Layer 2 — Cloud Brain (AI Agents)](#layer-2--cloud-brain-ai-agents)
  - [Layer 3 — Caregiver Web App](#layer-3--caregiver-web-app)
- [Agent Deep-Dive](#-agent-deep-dive)
- [Data Flow](#-data-flow)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Supabase Setup](#1-supabase-setup)
  - [2. Cloud Brain (Railway)](#2-cloud-brain-railway)
  - [3. Device (Raspberry Pi)](#3-device-raspberry-pi)
  - [4. Caregiver App (Vercel)](#4-caregiver-app-vercel)
  - [5. Marketing Website](#5-marketing-website)
- [Environment Variables](#-environment-variables)
- [Deployment Guide](#-deployment-guide)
- [Security & Privacy](#-security--privacy)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 What is Mitra?

> **Mitra** (मित्र) means *friend* in Sanskrit — and that's exactly what it is.

Mitra is a **voice-first AI companion system** designed for two underserved groups:

| User | Problem | How Mitra Helps |
|------|---------|-----------------|
| 🧓 **Elderly people** | Loneliness, language barrier, cognitive decline | Speaks their mother tongue, remembers their life stories, detects distress |
| 👧 **Neurodivergent children** | Communication difficulty, anxiety, caregiver absence | Calm, short sentences, repetition-safe, guided interaction |

Mitra is not a chatbot. It is a **persistent, emotionally-aware companion** that:

- **Remembers** — Every conversation enriches a per-person memory graph (Mem0)
- **Understands** — Detects 5 emotional states in real time using Groq Llama-3
- **Protects** — Silently alerts caregivers via WhatsApp when crisis language is detected
- **Adapts** — Switches voice pace, vocabulary, and language based on the user's profile
- **Learns** — Pulls context from family-uploaded photos, stories, and voice clips via RAG

---

## 🏛 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Layer 1 — Physical Device (Raspberry Pi)            │
│                                                                       │
│  ┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌───┐ │
│  │  Wake Word  │  │  Speech-to-Text  │  │  Text-to-Speech  │  │🔊 │ │
│  │  Porcupine  │  │  Sarvam AI       │  │  Sarvam AI       │  │   │ │
│  │  (offline)  │  │  Indian langs    │  │  Natural voice   │  │   │ │
│  └─────────────┘  └──────────────────┘  └──────────────────┘  └───┘ │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ audio stream / HTTP
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Layer 2 — Cloud Brain (AI Agents)                   │
│                                                                       │
│  ┌──────────────┐   ┌─────────────────┐   ┌──────────────────────┐  │
│  │ Emotion Agent│   │  Memory Agent   │   │     RAG Agent        │  │
│  │              │   │                 │   │                      │  │
│  │ Detects:     │   │ Mem0 —          │   │ Pulls family uploads  │  │
│  │ calm/happy/  │   │ persistent      │   │ stories, photos,     │  │
│  │ anxious/sad/ │   │ per-user        │   │ docs via pgvector    │  │
│  │ distressed   │   │ profile graph   │   │                      │  │
│  └──────┬───────┘   └────────┬────────┘   └──────────┬───────────┘  │
│         │                   │                        │              │
│         ▼                   ▼                        ▼              │
│  ┌──────────────────┐   ┌──────────────────────────────────────┐   │
│  │  Response Agent  │   │          Safety Agent                │   │
│  │                  │   │                                      │   │
│  │  Groq Llama-3    │   │  Crisis detection →                  │   │
│  │  70B — fast,     │   │  silent caregiver alert              │   │
│  │  grounded gen    │   │  (WhatsApp via Twilio)               │   │
│  └──────────────────┘   └──────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                  Supabase pgvector                               │ │
│  │  Embeddings of all family uploads, memories, protocol docs      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
│         Orchestrated with LangGraph state machine                    │
│                                                                       │
│  ┌─────────────────────┐         ┌─────────────────────────────┐    │
│  │     Elder Mode      │         │        Child Mode           │    │
│  │  slow pace,         │         │  simple words, calm,        │    │
│  │  mother tongue      │         │  guided repetition          │    │
│  └─────────────────────┘         └─────────────────────────────┘    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ reports + alerts
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Layer 3 — Caregiver Web App (React + Vite)          │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────┐ │
│  │  Onboarding  │  │ Daily Report │  │Upload Center│  │  Alert   │ │
│  │              │  │              │  │             │  │  Center  │ │
│  │  Profile,    │  │  Emotion     │  │  Photos,    │  │          │ │
│  │  memories,   │  │  timeline,   │  │  voice      │  │  Crisis  │ │
│  │  language,   │  │  convo log   │  │  clips,     │  │  flags,  │ │
│  │  mode        │  │              │  │  stories→   │  │  anomaly │ │
│  │              │  │              │  │  RAG        │  │  alerts  │ │
│  └──────────────┘  └──────────────┘  └─────────────┘  └──────────┘ │
│                                                                       │
│  Deployed on Vercel · Auth via Supabase · Device paired via QR code  │
│           WhatsApp bot (Twilio) as secondary surface                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 System Layers

### Layer 1 — Physical Device (Raspberry Pi)

The device runs **fully offline wake-word detection** and streams audio to the cloud brain.

| Component | Technology | Details |
|-----------|-----------|---------|
| **Wake word** | [Porcupine](https://picovoice.ai/platform/porcupine/) | Custom "Mitra" keyword, runs 100% offline on-device |
| **Speech-to-Text** | [Sarvam AI](https://sarvam.ai) `saarika:v2` | Supports Hindi, Kannada, Tamil, Telugu, Marathi + 6 more |
| **Text-to-Speech** | [Sarvam AI](https://sarvam.ai) `bulbul:v1` | Natural Indian voice, adjustable pace (0.82× for elders) |
| **Speaker/Mic** | ReSpeaker 4-Mic HAT | Far-field voice pickup, built-in noise suppression |
| **Loop logic** | Python (`listener.py`) | Wake → Record → Transcribe → Brain → Synthesise → Play |

**Silence detection** is amplitude-based (`SILENCE_THRESHOLD = 0.008`), cutting the recording after 1.8s of quiet — ensuring natural pauses aren't mistaken for end-of-speech.

---

### Layer 2 — Cloud Brain (AI Agents)

The brain is a **FastAPI server** orchestrating a **LangGraph state machine** with 5 specialised agents running in sequence (with response + safety in parallel).

#### LangGraph Pipeline

```
load_profile → emotion → memory → rag → response_and_safety → END
                                         ↑                ↑
                                   (parallel async tasks)
```

#### MitraState (TypedDict)

```python
class MitraState(TypedDict):
    profile_id: str            # UUID of the companion profile
    transcript: str            # Raw speech-to-text from device
    profile: dict              # Full profile from Supabase
    emotion_label: str         # calm | happy | anxious | sad | distressed
    emotion_confidence: float  # 0.0–1.0
    retrieved_memories: list   # Mem0 semantic memories
    rag_context: list          # pgvector RAG chunks
    response: str              # Final Mitra reply
    safety_flag: bool          # True if caregiver alert sent
```

---

### Layer 3 — Caregiver Web App

Built with **React + Vite + TypeScript**, deployed on **Vercel**, auth via **Supabase**.

| Screen | Purpose |
|--------|---------|
| **Onboarding** | Create companion profile — name, age, language, mode, family members, triggers, comfort patterns |
| **Daily Report** | AI-generated narrative summary of the day's conversations, emotion timeline chart |
| **Upload Center** | Upload photos (GPT-4o describes them), voice clips (Sarvam transcribes), written stories — all ingested into RAG |
| **Alert Center** | Real-time crisis flags with severity, transcript excerpt, resolve/dismiss controls |

---

## 🤖 Agent Deep-Dive

### Emotion Agent (`agents/emotion.py`)

- **Model**: Groq `llama-3.1-8b-instant` (< 200ms latency)
- **Output**: `{label, confidence}` JSON
- **Labels**: `calm | happy | anxious | sad | distressed`
- **Used by**: Response agent (tone shaping) + Safety agent (gating)

```python
SYSTEM = """You are an emotion classifier. Given a conversational transcript,
classify the speaker's emotional state into exactly one of:
calm, happy, anxious, sad, distressed."""
```

---

### Memory Agent (`agents/memory.py`)

- **Backend**: [Mem0](https://mem0.ai) — persistent per-user memory graph
- **Operation**: Semantic search over all past conversations
- **Returned**: Top-3 relevant memories injected into response context
- **Also writes**: Saves every new conversation turn to the memory graph

---

### RAG Agent (`agents/rag.py`)

- **Backend**: Supabase pgvector (`match_memories` SQL function)
- **Embeddings**: OpenAI `text-embedding-3-small` (1536-dim)
- **Sources**: Family photos (GPT-4o described), voice clips (Sarvam transcribed), written stories, profile data
- **Retrieval**: Top-3 cosine-similarity chunks injected into response

---

### Response Agent (`agents/response.py`)

- **Model**: Groq `llama-3.1-70b-versatile` — fast, high-quality generation
- **Dual modes**: System prompt switches completely based on `profile.mode`

| Elder Mode | Child Mode |
|-----------|-----------|
| Max 2–3 short sentences | Max 1–2 sentences |
| Responds in mother tongue | Simple 8-word sentences |
| Warm, unhurried tone | Encouraging, repetition-safe |
| Uses family member names | Celebrates small moments |
| Never multiple questions | Never complex vocabulary |

---

### Safety Agent (`agents/safety.py`)

- **Two-stage detection**:
  1. **Keyword scan** — 14 crisis phrases checked offline (no LLM cost if clean)
  2. **LLM classification** — Only if keyword hit OR emotion is `distressed/anxious`
- **Severity levels**: `emergency | moderate | info`
- **Actions**: Save alert to DB + send WhatsApp message via Twilio
- **Silent design**: Mitra keeps speaking calmly while the alert fires in background

**Crisis keywords monitored:**
```
chest pain · can't breathe · fallen down · don't want to live
want to die · end my life · nobody cares · emergency
help me · i'm scared · very scared
```

---

## 🌊 Data Flow

```
User speaks "Mitra..."
        │
        ▼ (offline, on-device)
Porcupine detects wake word
        │
        ▼
Record audio until silence (1.8s gap)
        │
        ▼ (Sarvam AI API)
Speech-to-Text → transcript text
        │
        ▼ (HTTPS POST to Railway)
POST /conversation {profile_id, transcript}
        │
        ▼
LangGraph pipeline begins:
  1. Load profile from Supabase
  2. Emotion classification (Groq 8B, ~150ms)
  3. Retrieve Mem0 memories (semantic search)
  4. Retrieve RAG context (pgvector cosine)
  5. Parallel:
     ├─ Generate response (Groq 70B, ~800ms)
     └─ Safety check (Groq 8B + keyword scan)
  6. Save conversation log + update Mem0
  7. If safety_flag: save alert + WhatsApp Twilio
        │
        ▼ (JSON response back to device)
{response, safety_flag, emotion_label}
        │
        ▼ (Sarvam AI TTS)
Text-to-Speech → audio bytes
        │
        ▼
Play audio through ReSpeaker speaker
        │
        ▼ (async, background)
Caregiver app refreshes with new log entry
If safety_flag: alert appears in Alert Center
Caregiver receives WhatsApp message
```

---

## 🗄 Database Schema

Hosted on **Supabase** with full **Row Level Security (RLS)** — users can only access their own data.

### Tables

#### `profiles`
Core companion identity, used to shape every response.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | References `auth.users` |
| `companion_name` | text | The elder/child's name |
| `age` | integer | Used to calibrate response style |
| `language` | text | E.g. `Kannada`, `Hindi`, `Tamil` |
| `mode` | text | `elder` or `child` |
| `condition_notes` | text | Free-text context (diagnosis, background) |
| `favourite_topics` | jsonb | Topics safe to return to |
| `family_members` | jsonb | `[{name, relationship, note}]` |
| `triggers` | jsonb | Things that upset or confuse them |
| `comfort_patterns` | jsonb | De-escalation patterns |
| `schedule` | jsonb | `{morning: bool, evening: bool}` |

#### `memories`
pgvector embeddings for RAG retrieval.

| Column | Type | Description |
|--------|------|-------------|
| `profile_id` | uuid | FK to profiles |
| `content` | text | Text chunk (≤800 chars with 100-char overlap) |
| `embedding` | vector(1536) | OpenAI `text-embedding-3-small` |
| `source_type` | text | `profile_data`, `photo_description`, `voice_transcript`, `story` |
| `source_file_url` | text | Original Supabase Storage URL |

> **Index**: `ivfflat (embedding vector_cosine_ops)` with 100 lists for fast ANN search.

#### `conversation_logs`
Full audit trail of every interaction.

| Column | Type | Description |
|--------|------|-------------|
| `transcript` | text | What the user said |
| `response` | text | What Mitra replied |
| `emotion_label` | text | Detected emotion |
| `emotion_confidence` | float | 0.0–1.0 |
| `safety_flag` | boolean | True if alert was sent |
| `rag_chunks_used` | jsonb | Which memory chunks were retrieved |
| `mem0_memories_used` | jsonb | Which Mem0 memories were injected |

#### `alerts`
Safety events for the caregiver dashboard.

| Column | Type | Description |
|--------|------|-------------|
| `severity` | text | `emergency`, `moderate`, `info` |
| `transcript_excerpt` | text | First 200 chars of the triggering utterance |
| `emotion_label` | text | Emotion at time of alert |
| `resolved` | boolean | Caregiver can mark as resolved |

#### `caregiver_phones`
WhatsApp alert recipients (one per caregiver account).

#### `devices`
Paired Raspberry Pi devices with QR-code pairing token.

### SQL Functions

```sql
-- Cosine similarity search over embeddings
create or replace function match_memories(
  query_embedding vector(1536),
  match_profile_id uuid,
  match_count int default 3
)
returns table (id uuid, content text, similarity float)
```

---

## 📡 API Reference

Base URL: `https://mitra-brain.railway.app` (or `http://localhost:8000` locally)

### `POST /conversation`

Main pipeline endpoint. Called by the Raspberry Pi after every transcription.

**Request**
```json
{
  "profile_id": "uuid",
  "transcript": "I'm feeling a bit lonely today"
}
```

**Response**
```json
{
  "response": "I'm here with you. Tell me, what would you like to talk about today?",
  "safety_flag": false,
  "emotion_label": "sad"
}
```

---

### `POST /ingest/profile`

Re-embeds the profile data into pgvector. Run after profile edits.

```json
{ "profile_id": "uuid" }
```

---

### `POST /ingest/file`

Ingests a caregiver-uploaded file into RAG.

```json
{
  "profile_id": "uuid",
  "file_url": "https://xxxx.supabase.co/storage/v1/object/public/memories/...",
  "source_type": "photo_description"
}
```

`source_type` options: `photo_description` · `voice_transcript` · `story`

- **photo_description** → GPT-4o describes the image, result embedded
- **voice_transcript** → Sarvam AI transcribes the audio, result embedded
- **story** → Text is chunked and embedded directly

---

### `POST /report/daily`

Generates a caregiver-facing narrative summary of a day's conversations.

```json
{ "profile_id": "uuid", "date": "2026-06-26" }
```

**Response**
```json
{
  "summary": "Today was a gentle day for Ammamma. She spoke mostly about the garden and seemed calm and content in the morning..."
}
```

---

### `GET /health`

```json
{ "status": "ok" }
```

---

## 📁 Repository Structure

```
mitra-ai/
├── README.md                      ← You are here
├── .gitignore
│
├── device/                        ← Layer 1: Raspberry Pi
│   ├── listener.py                ← Main loop: wake → STT → brain → TTS → play
│   ├── requirements.txt
│   └── .env.example
│
├── mitra-brain/                   ← Layer 2: Cloud Brain (FastAPI + LangGraph)
│   ├── main.py                    ← FastAPI app + endpoints
│   ├── pipeline.py                ← LangGraph state machine (MitraState)
│   ├── ingest.py                  ← Embedding pipeline (profile, photo, voice, story)
│   ├── db.py                      ← Supabase client + CRUD helpers
│   ├── report.py                  ← Daily report generation (Groq 70B)
│   ├── alerts.py                  ← WhatsApp alert via Twilio
│   ├── requirements.txt
│   ├── .env.example
│   └── agents/
│       ├── __init__.py
│       ├── emotion.py             ← Groq Llama-3 8B emotion classifier
│       ├── memory.py              ← Mem0 read/write
│       ├── rag.py                 ← Supabase pgvector retrieval
│       ├── response.py            ← Groq Llama-3 70B response generator
│       └── safety.py              ← Crisis detection + Twilio WhatsApp alert
│
├── mitra-app/                     ← Layer 3: Caregiver Web App (React + Vite + TS)
│   ├── src/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   ├── .env.example
│   └── README.md
│
├── mitra-website/                 ← Marketing site (Next.js)
│   ├── app/
│   ├── components/
│   ├── package.json
│   └── README.md
│
├── supabase/
│   └── schema.sql                 ← All tables, indexes, RLS policies, storage buckets
│
└── docs/
    ├── architecture.md            ← Detailed architecture notes
    ├── deployment.md              ← Step-by-step deployment guide
    ├── hardware.md                ← Raspberry Pi + ReSpeaker setup
    ├── languages.md               ← Supported Indian languages
    └── safety-design.md           ← Safety agent design philosophy
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Cloud brain + device |
| Node.js | 18+ | Caregiver app + website |
| Raspberry Pi | 4B or 5 | Physical device |
| ReSpeaker 4-Mic HAT | — | Microphone array |
| Supabase account | — | Database + Auth + Storage |
| Groq account | Free tier works | LLM inference |
| Sarvam AI account | — | Indian language STT/TTS |
| Mem0 account | — | Persistent memory |
| OpenAI account | — | Embeddings + photo description |
| Twilio account | — | WhatsApp alerts |
| Picovoice account | — | Wake word engine |

---

### 1. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema:

```bash
# Copy and paste contents of supabase/schema.sql into the Supabase SQL Editor
```

3. Enable the **pgvector** extension (it's included in the schema SQL)
4. Create a **Storage bucket** called `memories` (also in the SQL)
5. Copy your **Project URL** and **Service Role Key** from Project Settings → API

---

### 2. Cloud Brain (Railway)

```bash
# Clone the repo
git clone https://github.com/chetx27/mitra-ai.git
cd mitra-ai/mitra-brain

# Local development
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see Environment Variables section)

# Run locally
uvicorn main:app --reload --port 8000

# Test health
curl http://localhost:8000/health
```

**Deploy to Railway:**
1. Push repo to GitHub
2. Create new Railway project → Deploy from GitHub repo
3. Set root directory to `mitra-brain/`
4. Add all environment variables in Railway dashboard
5. Railway auto-detects `requirements.txt` and starts the server

---

### 3. Device (Raspberry Pi)

```bash
# SSH into your Raspberry Pi
ssh pi@<raspberry-pi-ip>

# Install system dependencies
sudo apt-get update
sudo apt-get install -y portaudio19-dev python3-pip

# Install ReSpeaker HAT drivers (follow Seeed wiki for your HAT model)

# Clone and set up
git clone https://github.com/chetx27/mitra-ai.git
cd mitra-ai/device

pip3 install -r requirements.txt

cp .env.example .env
nano .env
# Fill in:
# MITRA_PROFILE_ID=<uuid from Supabase profiles table>
# MITRA_API_URL=https://your-brain.railway.app
# SARVAM_API_KEY=<your key>
# PORCUPINE_ACCESS_KEY=<your key>
# MITRA_LANGUAGE=kn-IN   # or hi-IN, ta-IN, te-IN, etc.

# Run
python3 listener.py

# To run on boot (systemd):
# See docs/hardware.md for systemd unit file
```

**Language codes** — see [docs/languages.md](docs/languages.md) for the full list.

---

### 4. Caregiver App (Vercel)

```bash
cd mitra-ai/mitra-app

cp .env.example .env
# Fill in Supabase URL, anon key, and brain API URL

npm install
npm run dev        # http://localhost:5173
```

**Deploy to Vercel:**
```bash
npm install -g vercel
vercel --prod
# Set environment variables in Vercel dashboard
```

---

### 5. Marketing Website

```bash
cd mitra-ai/mitra-website
npm install
npm run dev        # http://localhost:3000
```

---

## 🔑 Environment Variables

### `mitra-brain/.env`

```env
GROQ_API_KEY=gsk_...              # Groq — LLM inference (emotion, response, safety, report)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...       # Service role key (bypasses RLS — keep secret!)
SARVAM_API_KEY=...                # Sarvam AI — voice transcription for uploaded clips
MEM0_API_KEY=m0-...               # Mem0 — persistent memory graph
OPENAI_API_KEY=sk-...             # OpenAI — embeddings (text-embedding-3-small) + photo desc
TWILIO_ACCOUNT_SID=AC...          # Twilio — WhatsApp alerts
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886   # Twilio sandbox number
```

### `device/.env`

```env
MITRA_PROFILE_ID=uuid             # The companion's profile UUID from Supabase
MITRA_API_URL=https://mitra-brain.railway.app
SARVAM_API_KEY=...                # For STT and TTS
PORCUPINE_ACCESS_KEY=...          # Picovoice — wake word
MITRA_LANGUAGE=kn-IN              # BCP-47 language code
```

### `mitra-app/.env`

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...     # Anon key (safe to expose in frontend)
VITE_API_URL=https://mitra-brain.railway.app
```

---

## 🚢 Deployment Guide

See [docs/deployment.md](docs/deployment.md) for the full step-by-step guide, including:

- Railway auto-scaling for the cloud brain
- Vercel edge config for the caregiver app
- Supabase connection pooling with PgBouncer
- Raspberry Pi systemd service for auto-restart
- Custom Porcupine wake word training

---

## 🔒 Security & Privacy

| Concern | Mitigation |
|---------|-----------|
| **Conversation data** | Stored in Supabase with RLS — users only access their own profiles |
| **Service key** | Only used server-side in Railway — never exposed to frontend |
| **Frontend auth** | Supabase anon key + JWT session — standard pattern |
| **Audio data** | Never stored permanently — transcribed in transit, audio bytes discarded |
| **WhatsApp** | Caregiver must opt-in by registering their phone number |
| **Crisis keywords** | First-pass check is local string match — no LLM cost on safe conversations |
| **Profile data** | Embedded into pgvector per-profile, isolated by `profile_id` FK |

> **Note**: The `SUPABASE_SERVICE_KEY` bypasses RLS. It lives **only** in the Railway backend environment. Never put it in the frontend app.

---

## 🗺 Roadmap

### ✅ v1.0 — Current
- [x] Wake word detection (Porcupine, offline)
- [x] Indian language STT/TTS (Sarvam AI)
- [x] 5-agent LangGraph pipeline
- [x] Mem0 persistent per-user memory
- [x] pgvector RAG with family uploads
- [x] Emotion classification (5 states)
- [x] Safety detection + WhatsApp alerts
- [x] Elder mode / Child mode
- [x] Caregiver dashboard (React + Vite)
- [x] Daily report generation
- [x] Supabase auth + RLS

### 🔄 v1.1 — In Progress
- [ ] QR-code device pairing flow in caregiver app
- [ ] Emotion timeline chart (recharts)
- [ ] Scheduled morning/evening check-ins
- [ ] WhatsApp bot as primary interface for device-less users

### 🔮 v2.0 — Planned
- [ ] Multimodal — camera for facial expression analysis
- [ ] Proactive mode — Mitra initiates conversation based on schedule
- [ ] Group family memory — multiple caregivers, shared upload center
- [ ] On-device LLM (llama.cpp on Pi 5) for fully offline mode
- [ ] iOS/Android caregiver app
- [ ] ABDM health data integration (India health stack)
- [ ] Multilingual RAG — retrieve in language, answer in language
- [ ] Voice activity detection improvements (Silero VAD)
- [ ] Longitudinal emotion trends + anomaly detection

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

```bash
# Fork and clone
git clone https://github.com/<your-fork>/mitra-ai.git

# Create a feature branch
git checkout -b feat/your-feature-name

# Make changes, then
git commit -m "feat: describe your change"
git push origin feat/your-feature-name

# Open a Pull Request on GitHub
```

**Good first issues:**
- Adding support for a new Indian language in the device
- Improving the emotion classifier with more nuanced labels
- Adding unit tests for the pipeline agents
- Improving the Supabase RLS policies

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for grandparents and children who deserve a patient, always-present friend.

**Mitra — मित्र — Friend**

</div>
