# Mitra — Deployment Guide

## Overview

| Component | Platform | Auto-deploy? |
|-----------|----------|-------------|
| Cloud Brain (FastAPI) | Railway | Yes (GitHub push) |
| Caregiver App (React) | Vercel | Yes (GitHub push) |
| Marketing Website (Next.js) | Vercel | Yes (GitHub push) |
| Database + Auth + Storage | Supabase | Manual schema run |
| Device (Python) | Raspberry Pi | systemd unit |

---

## 1. Supabase

### Initial Setup

1. Go to [supabase.com](https://supabase.com) → Create new project
2. Wait for provisioning (~2 min)
3. Go to **SQL Editor** → paste entire contents of `supabase/schema.sql` → Run
4. Verify tables exist: **Table Editor** should show `profiles`, `memories`, `conversation_logs`, `alerts`, `caregiver_phones`, `devices`
5. Go to **Storage** → confirm `memories` bucket exists (created by schema)

### Getting Your Keys

| Key | Where to find |
|-----|--------------|
| Project URL | Settings → API → Project URL |
| Anon Key | Settings → API → `anon` `public` |
| Service Role Key | Settings → API → `service_role` `secret` ⚠️ Keep secret |

### Connection Pooling (Production)

For Railway with multiple workers, use Supabase's **PgBouncer** connection string:

- Settings → Database → Connection string → **Transaction mode** (port 6543)
- Set `SUPABASE_DB_URL` in Railway to this pooled URL
- The Python `supabase` client uses the REST API (not direct Postgres), so pooling is automatically handled

---

## 2. Cloud Brain — Railway

### First Deploy

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Select `mitra-ai` repo
4. Railway will auto-detect → click **Configure**
5. Set **Root Directory**: `mitra-brain`
6. Railway detects `requirements.txt` → sets start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Environment Variables (Railway)

Add these in Railway → Variables:

```
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
SARVAM_API_KEY=...
MEM0_API_KEY=m0-...
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
```

### Getting the Railway URL

After deploy: Railway → your service → Settings → **Domains** → copy URL  
Example: `https://mitra-brain-production.up.railway.app`

This goes into:
- `device/.env` → `MITRA_API_URL`
- `mitra-app/.env` → `VITE_API_URL`

### Scaling

Railway auto-scales. For production:
- Set **Sleep policy**: None (always on) — prevents cold starts
- Memory: 512MB is sufficient for the brain; set **Max Memory** to 1GB for safety

---

## 3. Caregiver App — Vercel

### Deploy

```bash
cd mitra-app
npm install -g vercel
vercel login
vercel --prod
```

Or connect via Vercel dashboard → New Project → Import Git Repository → set **Root Directory** to `mitra-app`.

### Environment Variables (Vercel)

In Vercel → Project → Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=https://mitra-brain-production.up.railway.app
```

### Custom Domain

Vercel → Domains → Add your domain → follow DNS instructions.

---

## 4. Marketing Website — Vercel

```bash
cd mitra-website
vercel --prod
# Set Root Directory to mitra-website in Vercel dashboard
```

No environment variables needed for the static marketing site.

---

## 5. Raspberry Pi — Device

### Hardware Requirements

| Item | Spec |
|------|------|
| Raspberry Pi | 4B (4GB RAM) or 5 |
| MicroSD | 32GB+ Class 10 |
| ReSpeaker 4-Mic HAT | Seeed Studio |
| Power supply | Official Pi 5V/3A |
| Speaker | 3.5mm jack or USB |

### OS Setup

```bash
# Use Raspberry Pi OS Lite (64-bit) — no GUI needed
# Flash with Raspberry Pi Imager

# After boot, enable SSH and connect
ssh pi@<raspberry-pi-ip>

# Update
sudo apt-get update && sudo apt-get upgrade -y

# Install audio dependencies
sudo apt-get install -y portaudio19-dev python3-pip libsndfile1
```

### ReSpeaker HAT Installation

```bash
# Follow Seeed Studio driver guide for your HAT version
# For ReSpeaker 4-Mic Array v2.0:
git clone --depth=1 https://github.com/HinTak/seeed-voicecard
cd seeed-voicecard
sudo ./install.sh
sudo reboot

# Verify microphone works
arecord -D plughw:1,0 -f S16_LE -r 16000 -c 1 -d 5 test.wav
aplay test.wav
```

### Mitra Device Setup

```bash
git clone https://github.com/chetx27/mitra-ai.git
cd mitra-ai/device

pip3 install -r requirements.txt

cp .env.example .env
nano .env
```

Fill in `.env`:
```env
MITRA_PROFILE_ID=<uuid>          # From Supabase profiles table
MITRA_API_URL=https://mitra-brain-production.up.railway.app
SARVAM_API_KEY=<your-key>
PORCUPINE_ACCESS_KEY=<your-key>
MITRA_LANGUAGE=kn-IN             # BCP-47 code for the user's language
```

### systemd Service (Auto-restart on boot)

```bash
sudo nano /etc/systemd/system/mitra.service
```

```ini
[Unit]
Description=Mitra AI Companion
After=network.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/mitra-ai/device
ExecStart=/usr/bin/python3 /home/pi/mitra-ai/device/listener.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mitra
sudo systemctl start mitra

# Check status
sudo systemctl status mitra
sudo journalctl -u mitra -f   # Live logs
```

---

## 6. Twilio WhatsApp Setup

### Sandbox (Development)

1. Go to [twilio.com/console](https://console.twilio.com)
2. Messaging → Try it out → Send a WhatsApp message
3. Follow sandbox join instructions (WhatsApp the sandbox number)
4. Use `whatsapp:+14155238886` as `TWILIO_WHATSAPP_FROM`

### Production WhatsApp Business API

1. Apply for WhatsApp Business API at twilio.com/whatsapp/request-access
2. Approval takes 1–7 days
3. Once approved, use your approved WhatsApp Business number as `TWILIO_WHATSAPP_FROM`

---

## 7. Picovoice (Wake Word)

1. Create account at [picovoice.ai](https://picovoice.ai)
2. Copy your **Access Key** from the console
3. The `keywords=["mitra"]` uses the built-in "Mitra" wake word

### Custom Wake Word (Optional)

If you want a custom wake phrase (e.g., "Hey Mitra" or a local name):

1. Go to [Picovoice Console](https://console.picovoice.ai) → Wake Word → Create
2. Enter your phrase → train → download `.ppn` file
3. Update `listener.py`:

```python
porcupine = pvporcupine.create(
    access_key=PORCUPINE_KEY,
    keyword_paths=["path/to/your-custom-wake-word_raspberry-pi.ppn"],
)
```

---

## 8. Profile Setup (First Onboarding)

After deploying the caregiver app:

1. Sign up at `https://your-caregiver-app.vercel.app`
2. Complete the onboarding form — this creates a `profiles` row in Supabase
3. Copy the profile UUID from the URL or Supabase Table Editor
4. Put this UUID in `device/.env` as `MITRA_PROFILE_ID`
5. Trigger initial profile ingestion:

```bash
curl -X POST https://mitra-brain-production.up.railway.app/ingest/profile \
  -H "Content-Type: application/json" \
  -d '{"profile_id": "<your-profile-uuid>"}'
```

6. Restart the device: `sudo systemctl restart mitra`
7. Say "Mitra" — the device should respond with a warm greeting

---

## Monitoring

### Railway Logs
Railway → your service → **Logs** tab — real-time stdout from FastAPI

### Supabase Monitoring
Supabase → Reports → API usage, Database size, Storage

### Device Logs
```bash
sudo journalctl -u mitra -f --since "1 hour ago"
```

### Health Check
```bash
curl https://mitra-brain-production.up.railway.app/health
# Expected: {"status": "ok"}
```
