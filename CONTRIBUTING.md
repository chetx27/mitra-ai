# Contributing to Mitra

Thank you for wanting to contribute! Mitra is built for people who often don't have a voice in technology — your contributions make a real difference.

## Code of Conduct

Be kind. This project serves elderly people and neurodivergent children. Keep that human context in mind in all discussions.

## How to Contribute

### Bug Reports

Open a GitHub Issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your environment (OS, Python version, device model if relevant)

### Feature Requests

Open a GitHub Issue tagged `enhancement`. Describe:
- The user problem being solved (frame it around the elderly user or caregiver, not the technology)
- Proposed solution
- Alternatives you considered

### Pull Requests

1. Fork the repo
2. Create a branch: `git checkout -b feat/your-feature` or `fix/your-bug`
3. Make your changes
4. Test locally (see Testing section below)
5. Commit with a clear message: `feat: add Tamil TTS support` / `fix: silence threshold too aggressive`
6. Push and open a PR against `main`

## Development Setup

### Cloud Brain

```bash
cd mitra-brain
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill in .env with test API keys

uvicorn main:app --reload
```

Test the pipeline locally:
```bash
curl -X POST http://localhost:8000/conversation \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "test-uuid", "transcript": "I miss my daughter today"}'
```

### Caregiver App

```bash
cd mitra-app
npm install
cp .env.example .env
npm run dev
```

## Testing

Currently, the project relies on integration testing via the API. Unit test contributions are very welcome.

**Priority test targets:**
- `agents/emotion.py` — mock Groq responses, verify label parsing and fallback
- `agents/safety.py` — verify keyword scan logic, mock LLM, verify alert creation
- `pipeline.py` — mock all agents, verify state propagation
- `ingest.py` — mock OpenAI and Sarvam, verify chunking logic

## Areas Most in Need of Help

| Area | Skill needed |
|------|-------------|
| Indian language crisis keywords | Native speaker + Python |
| Unit tests for agents | Python + pytest |
| Emotion timeline chart | React + recharts |
| Raspberry Pi systemd hardening | Linux sysadmin |
| WhatsApp bot interface | Twilio + Python |
| On-device LLM (llama.cpp) | C++ / Python / RPi |
| Accessibility in caregiver app | Frontend / a11y |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: short description
fix: short description
docs: short description
chore: short description
refactor: short description
```

## Questions?

Open a GitHub Discussion or Issue tagged `question`.
