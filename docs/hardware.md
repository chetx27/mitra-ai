# Mitra — Hardware Setup Guide

## Bill of Materials

| Component | Recommended Model | Approx. Cost (INR) | Notes |
|-----------|------------------|---------------------|-------|
| Raspberry Pi 4B | 4GB RAM model | ₹7,000 | 2GB works but tight |
| MicroSD card | SanDisk Extreme 32GB | ₹800 | Class 10 / A2 rating |
| ReSpeaker HAT | 4-Mic Array v2.0 | ₹2,500 | Seeed Studio |
| Power supply | Official Pi 4 USB-C 5V/3A | ₹700 | Do not use phone charger |
| Speaker | USB or 3.5mm, 5W | ₹500–1500 | Any portable speaker works |
| Case | Official Raspberry Pi case | ₹400 | Or 3D-printed enclosure |
| **Total** | | **~₹12,000–14,000** | Per device |

---

## Assembly

### 1. Flash OS

1. Download [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Choose: **Raspberry Pi OS Lite (64-bit)** — no desktop needed
3. Advanced settings (⚙️): set hostname, enable SSH, set WiFi SSID + password
4. Flash to MicroSD

### 2. Mount ReSpeaker HAT

1. Power off the Pi
2. Align the 40-pin GPIO header on the ReSpeaker HAT with the Pi's GPIO pins
3. Press firmly until fully seated
4. The HAT covers the Pi's 3.5mm audio jack — use the HAT's 3.5mm output for the speaker, or use USB speaker

### 3. First Boot

```bash
# Insert MicroSD, connect power
# Wait ~60 seconds for first boot

# SSH in
ssh pi@mitra.local   # or use IP address from your router
```

### 4. Install ReSpeaker Drivers

```bash
sudo apt-get update
sudo apt-get install -y git

git clone --depth=1 https://github.com/HinTak/seeed-voicecard
cd seeed-voicecard
sudo ./install.sh
sudo reboot
```

After reboot:
```bash
# Verify audio cards
aplay -l
# Should show: seeed-4mic-voicecard

# Test microphone (record 5 seconds)
arecord -D plughw:1,0 -f S16_LE -r 16000 -c 1 -d 5 test.wav

# Play it back
aplay test.wav
```

### 5. Install Mitra

```bash
# Install system dependencies
sudo apt-get install -y portaudio19-dev python3-pip libsndfile1 python3-venv

# Clone repo
git clone https://github.com/chetx27/mitra-ai.git
cd mitra-ai/device

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Configure
cp .env.example .env
nano .env
```

### 6. Test Before systemd

```bash
# With venv active
python listener.py

# Say "Mitra" — should see:
# Mitra is ready. Profile: <uuid>. Language: kn-IN
# (then say something)
# Wake word: Mitra
# Heard: <your words>
# Mitra: <response>

# Ctrl+C to stop
```

### 7. systemd Service

```bash
# Create service file
sudo nano /etc/systemd/system/mitra.service
```

```ini
[Unit]
Description=Mitra AI Companion Device
After=network-online.target sound.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/mitra-ai/device
ExecStart=/home/pi/mitra-ai/device/venv/bin/python listener.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable mitra
sudo systemctl start mitra

# Check it's running
sudo systemctl status mitra
```

---

## Audio Tuning

### Microphone Sensitivity

If Mitra isn't picking up the user's voice clearly:

```bash
# Open alsamixer
alsamixer

# Press F6, select seeed-4mic-voicecard
# Increase "Capture" level (use arrow keys)
# Press Esc to save
```

### Silence Threshold

In `listener.py`, the silence threshold controls how sensitive the end-of-speech detection is:

```python
SILENCE_THRESHOLD = 0.008   # Default — works for most indoor environments
```

- **Noisy environment** (TV on, kitchen sounds): Increase to `0.012`–`0.015`
- **Very quiet room**: Decrease to `0.005`

### Volume

Adjust speaker volume:
```bash
amixer sset 'Master' 80%
# Or use alsamixer for interactive control
```

---

## Enclosure

For a production deployment in a home, the Raspberry Pi + HAT + speaker can be enclosed in:

1. **Official Raspberry Pi Case** + external USB speaker — simple, cheap
2. **3D-printed custom enclosure** — more polished, can integrate speaker in the case
3. **Repurposed smart speaker shell** — aesthetically familiar to elderly users

**Placement recommendations:**
- Place on a shelf or side table at chest height, not on the floor
- Within 1–2 metres of where the user typically sits
- Away from TV/radio that could trigger wake word
- Near a power outlet (device must stay plugged in)

---

## Network Requirements

| Requirement | Detail |
|-------------|--------|
| WiFi | 2.4GHz or 5GHz, any modern router |
| Bandwidth | ~1 Mbps is sufficient (audio files are small) |
| Latency | < 200ms to Railway server recommended |
| Firewall | Outbound HTTPS (443) only — no inbound ports needed |

**Offline behaviour**: If the internet is unavailable, the wake word detection continues working (offline/on-device), but transcription, brain response, and TTS will fail gracefully. The device logs the error and retries on the next wake word detection.

---

## Troubleshooting

### "No module named pvporcupine"
```bash
source venv/bin/activate
pip install pvporcupine
```

### "ALSA: cannot open device"
```bash
# Check audio device index
python3 -c "import pyaudio; pa = pyaudio.PyAudio(); [print(pa.get_device_info_by_index(i)) for i in range(pa.get_device_count())]"
# Find the seeed device and update CHUNK_SIZE or audio device index in listener.py
```

### Wake word not triggering
- Check `PORCUPINE_ACCESS_KEY` in `.env` is valid
- Ensure microphone is picking up audio: `arecord -D plughw:1,0 -f S16_LE -r 16000 -c 1 -d 3 test.wav && aplay test.wav`
- Try increasing microphone sensitivity in alsamixer

### Response is very slow
- Check Railway service is running: `curl https://your-brain.railway.app/health`
- Ensure Railway service is not sleeping (set Sleep policy to None)
- Check device network: `ping google.com`

### No audio output
- Check speaker is connected to HAT's 3.5mm port (not Pi's built-in port, which is covered by the HAT)
- Or use USB speaker
- `amixer sset 'Master' 90%` and retry
