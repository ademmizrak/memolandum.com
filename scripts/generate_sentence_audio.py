"""İlkokul cümle TTS — çocuk dostu ton (edge-tts Neural → Gemini → gTTS)."""
import asyncio
import json
import os
import sys
import time
import wave

from gtts import gTTS

try:
    import edge_tts
except ImportError:
    edge_tts = None

# Warm, clear child-friendly US English (Ana ≈ younger; Jenny = warm teacher)
EDGE_VOICE = os.environ.get("EDGE_TTS_VOICE", "en-US-AnaNeural")
EDGE_RATE = os.environ.get("EDGE_TTS_RATE", "+5%")
EDGE_PITCH = os.environ.get("EDGE_TTS_PITCH", "+25Hz")


def load_key_from_env_file():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if key:
        return key
    for env_path in ("d:/000Memorade/.env.local", "d:/000Memorade/.env"):
        if not os.path.exists(env_path):
            continue
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val
    return None


JSON_PATH = (
    (sys.argv[1] if len(sys.argv) > 1 else None)
    or os.environ.get("ILKOKUL_SENTENCES_JSON")
    or "public/data/Tr_Eng_Ilkokul/Ilkokul_4_Sinif_Cumleleri.json"
)
AUDIO_DIR = "public/data/Tr_Eng_Ilkokul/Audio/Sentences"
os.makedirs(AUDIO_DIR, exist_ok=True)

USE_GEMINI = os.environ.get("USE_GEMINI_TTS", "0") == "1"
FORCE = "--force" in sys.argv or os.environ.get("FORCE_TTS") == "1"


def save_pcm_as_wav(pcm_data: bytes, wav_path: str, sample_rate: int = 24000):
    with wave.open(wav_path, "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)


async def edge_synthesize(text: str, out_mp3: str):
    communicate = edge_tts.Communicate(
        text,
        EDGE_VOICE,
        rate=EDGE_RATE,
        pitch=EDGE_PITCH,
    )
    await communicate.save(out_mp3)


def try_edge(text: str, out_mp3: str) -> bool:
    if edge_tts is None:
        return False
    try:
        asyncio.run(edge_synthesize(text, out_mp3))
        return os.path.exists(out_mp3) and os.path.getsize(out_mp3) > 500
    except Exception as e:
        print(f"    edge-tts failed: {e}")
        return False


def try_gemini(text: str, out_wav: str) -> bool:
    api_key = load_key_from_env_file()
    if not api_key:
        return False
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    prompt = (
        "Speak warmly and clearly for primary school children learning English. "
        "Use a friendly, encouraging, natural classroom tone with gentle intonation "
        f"(not robotic). Say exactly this sentence:\n{text}"
    )
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-tts",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name="Kore"  # warm / expressive
                        )
                    )
                ),
            ),
        )
        audio_bytes = None
        if response.candidates:
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.data:
                    audio_bytes = part.inline_data.data
                    break
        if not audio_bytes:
            return False
        save_pcm_as_wav(audio_bytes, out_wav)
        time.sleep(7.0)
        return True
    except Exception as e:
        print(f"    Gemini failed: {e}")
        return False


def main():
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        sentences = json.load(f)

    print(
        f"Sentence TTS (child-friendly) — {len(sentences)} items\n"
        f"  voice={EDGE_VOICE} rate={EDGE_RATE} pitch={EDGE_PITCH}\n"
        f"  file={JSON_PATH}\n"
    )

    for index, item in enumerate(sentences, start=1):
        sid = item["sentence_id"]
        text = (item.get("english") or item.get("sentence") or "").strip()
        wav_path = os.path.join(AUDIO_DIR, f"{sid}.wav")
        mp3_path = os.path.join(AUDIO_DIR, f"{sid}.mp3")

        if not FORCE:
            has_wav = os.path.exists(wav_path) and os.path.getsize(wav_path) > 1000
            has_mp3 = os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000
            if has_wav or has_mp3:
                actual = (
                    f"/data/Tr_Eng_Ilkokul/Audio/Sentences/{sid}.wav"
                    if has_wav
                    else f"/data/Tr_Eng_Ilkokul/Audio/Sentences/{sid}.mp3"
                )
                if item.get("audio_url") != actual:
                    item["audio_url"] = actual
                    with open(JSON_PATH, "w", encoding="utf-8") as f:
                        json.dump(sentences, f, ensure_ascii=False, indent=2)
                print(f"[{index}/{len(sentences)}] skip {sid}")
                continue

        print(f"[{index}/{len(sentences)}] {sid}: {text[:70]}")

        done = False
        # 1) edge-tts Neural — natural, kid-friendly
        if try_edge(text, mp3_path):
            item["audio_url"] = f"/data/Tr_Eng_Ilkokul/Audio/Sentences/{sid}.mp3"
            print(f"    edge-tts ({EDGE_VOICE}) -> {mp3_path}")
            done = True
            time.sleep(0.35)
        # 2) optional Gemini
        elif USE_GEMINI and try_gemini(text, wav_path):
            item["audio_url"] = f"/data/Tr_Eng_Ilkokul/Audio/Sentences/{sid}.wav"
            print(f"    Gemini Kore -> {wav_path}")
            done = True
        # 3) gTTS last resort
        else:
            tts = gTTS(text=text, lang="en", tld="co.uk")
            tts.save(mp3_path)
            item["audio_url"] = f"/data/Tr_Eng_Ilkokul/Audio/Sentences/{sid}.mp3"
            print(f"    gTTS fallback -> {mp3_path}")
            time.sleep(0.8)

        if done or True:
            with open(JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(sentences, f, ensure_ascii=False, indent=2)

    print("\nDone.")


if __name__ == "__main__":
    main()
