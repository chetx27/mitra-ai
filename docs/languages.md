# Mitra — Supported Indian Languages

Mitra uses [Sarvam AI](https://sarvam.ai) for both Speech-to-Text (STT) and Text-to-Speech (TTS), enabling support for 10+ Indian languages.

## Language Codes

Set `MITRA_LANGUAGE` in `device/.env` to one of the following BCP-47 codes:

| Language | Code | Script | STT | TTS | Notes |
|----------|------|--------|-----|-----|-------|
| **Kannada** | `kn-IN` | kannada | ✅ | ✅ | Default language |
| **Hindi** | `hi-IN` | Devanagari | ✅ | ✅ | Most widely spoken |
| **Tamil** | `ta-IN` | Tamil | ✅ | ✅ | |
| **Telugu** | `te-IN` | Telugu | ✅ | ✅ | |
| **Malayalam** | `ml-IN` | Malayalam | ✅ | ✅ | |
| **Marathi** | `mr-IN` | Devanagari | ✅ | ✅ | |
| **Bengali** | `bn-IN` | Bengali | ✅ | ✅ | |
| **Gujarati** | `gu-IN` | Gujarati | ✅ | ✅ | |
| **Odia** | `od-IN` | Odia | ✅ | ✅ | |
| **Punjabi** | `pa-IN` | Gurmukhi | ✅ | ✅ | |
| **English (India)** | `en-IN` | Latin | ✅ | ✅ | Indian accent |

## Setting the Language

### For the Device

```env
# device/.env
MITRA_LANGUAGE=kn-IN
```

The device uses this code for both STT (transcription) and TTS (voice synthesis).

### For the Profile

In the caregiver app onboarding, the `language` field accepts the **full language name** (e.g., `Kannada`, `Hindi`, `Tamil`). This is what the response agent uses in its system prompt:

```
LANGUAGE: Always respond in Kannada. Never switch languages even if the person speaks another.
```

### Language Lock Behaviour

Mitra **never** switches languages mid-conversation, even if the elderly user code-switches (mixes languages). This is intentional — code-switching is natural for multilingual speakers and does not mean they want Mitra to change language. Only a caregiver can change the language by updating the profile.

## TTS Voice and Pace

The TTS call in `device/listener.py` uses the following defaults optimised for elderly listeners:

```python
json={
    "inputs": [text],
    "target_language_code": LANGUAGE,
    "speaker": "meera",     # Natural Indian female voice
    "pace": 0.82,           # 18% slower than normal — important for elder comprehension
    "model": "bulbul:v1",
}
```

**Changing the voice**: Sarvam supports multiple speakers. For a male voice, use `"speaker": "arvind"` (available in some languages). Check Sarvam AI docs for the full speaker list per language.

**Adjusting pace**: 
- Elderly users: `0.75`–`0.85`
- Child users: `0.90`–`1.0` (children often prefer normal pace)

## Language-Specific Considerations

### Kannada / Telugu / Tamil / Malayalam

These Dravidian languages use unique scripts that are fully supported by Sarvam AI. The model handles dialectal variation (e.g., colloquial Kannada vs. formal Kannada) well.

### Hindi / Marathi / Gujarati / Bengali

These Indo-Aryan languages often have regional accent variation. Sarvam `saarika:v2` handles this robustly.

### Code-Switching

Elderly speakers in multilingual households (e.g., Kannada-speaking grandparents who also know some Hindi) often mix languages. Mitra's STT will capture the mixed input correctly. The response agent is instructed to always reply in the profile language regardless.

## Adding a New Language

If Sarvam adds a new language:

1. Update `MITRA_LANGUAGE` in `device/.env`
2. Update the profile's `language` field to the new language name
3. Re-run profile ingestion: `POST /ingest/profile`
4. Restart the device

No code changes are needed — the language flows through environment variables and the Sarvam API calls.
