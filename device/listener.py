import pvporcupine
import pyaudio
import struct
import wave
import io
import os
import time
import requests
import numpy as np
import sounddevice as sd
import soundfile as sf
from dotenv import load_dotenv

load_dotenv()

PROFILE_ID = os.environ["MITRA_PROFILE_ID"]
API_URL = os.environ["MITRA_API_URL"]
SARVAM_KEY = os.environ["SARVAM_API_KEY"]
PORCUPINE_KEY = os.environ["PORCUPINE_ACCESS_KEY"]
LANGUAGE = os.environ.get("MITRA_LANGUAGE", "kn-IN")

SAMPLE_RATE = 16000
SILENCE_THRESHOLD = 0.008
SILENCE_DURATION_SECS = 1.8
CHUNK_SIZE = 512


def transcribe(audio_bytes: bytes) -> str:
    resp = requests.post(
        "https://api.sarvam.ai/speech-to-text",
        headers={"api-subscription-key": SARVAM_KEY},
        files={"file": ("audio.wav", audio_bytes, "audio/wav")},
        data={"language_code": LANGUAGE, "model": "saarika:v2"},
        timeout=15,
    )
    resp.raise_for_status()
    return resp.json().get("transcript", "").strip()


def synthesise(text: str) -> bytes:
    resp = requests.post(
        "https://api.sarvam.ai/text-to-speech",
        headers={"api-subscription-key": SARVAM_KEY, "Content-Type": "application/json"},
        json={
            "inputs": [text],
            "target_language_code": LANGUAGE,
            "speaker": "meera",
            "pace": 0.82,
            "model": "bulbul:v1",
        },
        timeout=15,
    )
    resp.raise_for_status()
    return resp.content


def call_brain(transcript: str) -> str:
    resp = requests.post(
        f"{API_URL}/conversation",
        json={"profile_id": PROFILE_ID, "transcript": transcript},
        timeout=12,
    )
    resp.raise_for_status()
    return resp.json()["response"]


def play(audio_bytes: bytes):
    buf = io.BytesIO(audio_bytes)
    data, sr = sf.read(buf)
    sd.play(data, sr)
    sd.wait()


def record_until_silence(pa: pyaudio.PyAudio) -> bytes:
    stream = pa.open(
        rate=SAMPLE_RATE, channels=1,
        format=pyaudio.paInt16,
        input=True, frames_per_buffer=CHUNK_SIZE,
    )
    frames = []
    silent = 0
    max_silent = int(SILENCE_DURATION_SECS * SAMPLE_RATE / CHUNK_SIZE)
    min_frames = int(0.5 * SAMPLE_RATE / CHUNK_SIZE)

    while True:
        data = stream.read(CHUNK_SIZE, exception_on_overflow=False)
        frames.append(data)
        amp = np.abs(np.frombuffer(data, np.int16).astype(np.float32) / 32768.0).mean()
        if amp < SILENCE_THRESHOLD:
            silent += 1
        else:
            silent = 0
        if silent >= max_silent and len(frames) >= min_frames:
            break

    stream.stop_stream()
    stream.close()

    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(pa.get_sample_size(pyaudio.paInt16))
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(b"".join(frames))
    return buf.getvalue()


def main():
    porcupine = pvporcupine.create(
        access_key=PORCUPINE_KEY,
        keywords=["mitra"],
    )
    pa = pyaudio.PyAudio()
    mic = pa.open(
        rate=porcupine.sample_rate,
        channels=1,
        format=pyaudio.paInt16,
        input=True,
        frames_per_buffer=porcupine.frame_length,
    )
    print(f"Mitra is ready. Profile: {PROFILE_ID}. Language: {LANGUAGE}")

    while True:
        try:
            pcm = mic.read(porcupine.frame_length, exception_on_overflow=False)
            pcm_unpacked = struct.unpack_from("h" * porcupine.frame_length, pcm)
            idx = porcupine.process(pcm_unpacked)

            if idx >= 0:
                print("Wake word: Mitra")
                mic.stop_stream()

                audio = record_until_silence(pa)
                transcript = transcribe(audio)
                if not transcript:
                    mic.start_stream()
                    continue

                print(f"Heard: {transcript}")
                response_text = call_brain(transcript)
                print(f"Mitra: {response_text}")

                audio_out = synthesise(response_text)
                play(audio_out)

                time.sleep(0.3)
                mic.start_stream()

        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"Error in loop: {e}")
            time.sleep(1)
            try:
                mic.start_stream()
            except Exception:
                pass

    mic.close()
    pa.terminate()
    porcupine.delete()


if __name__ == "__main__":
    main()
