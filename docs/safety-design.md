# Mitra — Safety Design Philosophy

## Why Safety Is a First-Class Feature

Mitra's users are among the most vulnerable people in any household:

- **Elderly users** may experience medical emergencies (falls, chest pain, breathing difficulty), acute mental health crises, or severe loneliness that manifests as suicidal ideation
- **Neurodivergent children** may have communication difficulties that prevent them from articulating distress clearly

A companion that simply fails to detect these moments is not just unhelpful — it's harmful. Mitra's safety system is designed with the following principles.

---

## Principle 1: Silent, Non-Disruptive Alerting

Mitra **never** changes its conversational behaviour when a safety concern is detected. The response agent and safety agent run in parallel. The user always receives a warm, appropriate response — never silence, never a robotic "I need to alert your caregiver."

**Why?** If Mitra visibly reacted to crisis language by pausing or acting differently, it could:
- Cause the user to feel surveilled or embarrassed
- Interrupt a moment when they most need someone to simply listen
- Train the user to avoid certain words (especially true for children)

The alert fires in the background. The user experiences continuity of care.

---

## Principle 2: Two-Stage Gate (Cost + Latency Control)

```
Stage 1: Keyword scan
  ↓ (if match or distressed emotion)
Stage 2: LLM classification
```

**Keyword scan** (Stage 1): A local Python string match against 14 crisis phrases. Zero latency, zero API cost. Catches obvious emergencies immediately.

**LLM classification** (Stage 2): Only runs when:
- A crisis keyword was detected (to determine severity), OR
- The emotion classifier returned `distressed` or `anxious`

This means that on a normal, happy conversation, the safety system processes in ~0ms and costs nothing.

---

## Principle 3: Severity-Graduated Response

Not all safety concerns are emergencies. The system distinguishes:

| Severity | Examples | Action |
|----------|----------|--------|
| `emergency` | "I can't breathe", "chest pain", "I've fallen" | WhatsApp alert immediately + DB record |
| `moderate` | Persistent sadness, confusion, expressed fear | WhatsApp alert + DB record |
| `info` | Mild anxiety, unusual emotional state | DB record only (visible in Alert Center) |

This prevents caregiver alert fatigue. Only genuinely urgent situations send a WhatsApp message.

---

## Principle 4: Caregiver Gets Context, Not Diagnosis

The WhatsApp message sent to caregivers is designed to:
- Give the exact words the user said (first 200 characters)
- State the severity clearly
- Reassure the caregiver that Mitra is still with the user
- **Not** attempt to diagnose or sensationalise

Example alert message:
```
Mitra Alert — Ammamma

Severity: MODERATE

What they said:
"I'm feeling very scared today, I don't know what's wrong with me, I miss Ravi so much"

Mitra is with them and speaking calmly. Please check in when you can.
```

---

## Principle 5: Fallback Safety

If the LLM call fails (network error, Groq downtime), the safety agent falls back to the keyword scan result:

```python
except Exception:
    if is_keyword_match:
        await save_alert(profile_id, "moderate", transcript[:200], emotion_label)
        return True, "moderate"
    return False, ""
```

A keyword match during an LLM failure still results in an alert at `moderate` severity. We'd rather have a false positive than a missed emergency.

---

## Crisis Keywords (v1.0)

The current keyword list covers:

```python
CRISIS_KEYWORDS = [
    "chest pain", "can't breathe", "cannot breathe", "fallen down", "fell down",
    "don't want to live", "want to die", "end my life", "nobody cares",
    "emergency", "help me", "i'm scared", "very scared",
]
```

**Limitations of the current list:**
- Only matches English phrases — crisis expressions in Kannada, Hindi, etc. rely on the emotion classifier (`distressed`) rather than keyword matching
- Partial phrase matching is not used — "I fell" would not match "fell down" — this is intentional to reduce false positives

**Roadmap:**
- Add language-specific crisis phrase lists for all 10 supported languages
- Implement fuzzy/partial matching with higher confidence threshold
- Train a fine-tuned classifier specifically on Indian-language crisis expressions

---

## Data Retention

All alerts are stored in the `alerts` table with `resolved: false` by default. Caregivers can:
- View all unresolved alerts in the Alert Center
- Mark an alert as `resolved: true` after checking in
- This creates an audit trail of safety events

No alerts are automatically deleted. Caregivers can review historical patterns (e.g., recurring sadness every Sunday evening) to identify systemic issues.

---

## False Positive Handling

The system will sometimes flag safe conversations. Design decisions to minimise this:

1. **Two-stage gate**: Keyword-only matches still go through LLM review before alerting
2. **LLM reasoning**: The Groq 8B classifier receives both the transcript AND the emotion label — context reduces false positives
3. **Severity calibration**: Borderline cases default to `info` severity (no WhatsApp, DB only)
4. **Caregiver trust**: Over time, caregivers build intuition about their companion's alert patterns

If a caregiver reports consistent false positives, the threshold can be raised by adjusting `CRISIS_KEYWORDS` or modifying the LLM system prompt's severity criteria.

---

## Privacy Considerations

- Transcript excerpts stored in alerts are truncated to 200 characters
- Full conversation logs are stored separately in `conversation_logs`
- Only the caregiver associated with the profile's `user_id` can see alerts (enforced by Supabase RLS)
- WhatsApp messages are sent to the registered caregiver phone only — no third-party logging by Twilio beyond standard message records
