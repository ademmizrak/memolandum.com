import json
import os
import sys
import time
import wave
from google import genai
from google.genai import types
from gtts import gTTS

# 1. Antigravity / Google AI Studio API Key
def load_key_from_env_file():
    key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if key:
        return key
    
    # Try reading from .env.local
    env_local_path = "d:/000Memorade/.env.local"
    if os.path.exists(env_local_path):
        with open(env_local_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line.startswith("GEMINI_API_KEY="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    if val:
                        return val
    return None

api_key = load_key_from_env_file()
if not api_key:
    raise ValueError("ERROR: GEMINI_API_KEY or GOOGLE_API_KEY not found in environment or .env.local!")

client = genai.Client(api_key=api_key)

# Default: 3. sınıf; override: ILKOKUL_WORDS_JSON=... or first CLI arg
JSON_PATH = (
    (sys.argv[1] if len(sys.argv) > 1 else None)
    or os.environ.get("ILKOKUL_WORDS_JSON")
    or "public/data/Tr_Eng_Ilkokul/Ilkokul_3_Sinif_Kelimeleri.json"
)
AUDIO_DIR = "public/data/Tr_Eng_Ilkokul/Audio"
os.makedirs(AUDIO_DIR, exist_ok=True)

def save_pcm_as_wav(pcm_data: bytes, wav_path: str, sample_rate: int = 24000):
    """RIFF WAV header addition for PCM 16-bit 24kHz mono audio."""
    with wave.open(wav_path, "wb") as wav_file:
        wav_file.setnchannels(1)      # Mono
        wav_file.setsampwidth(2)      # 16-bit (2 bytes)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(pcm_data)

def main():
    if not os.path.exists(JSON_PATH):
        raise FileNotFoundError(f"ERROR: {JSON_PATH} not found!")

    with open(JSON_PATH, "r", encoding="utf-8") as f:
        words = json.load(f)

    print(f"Starting Memolandum TTS Pipeline... (Total {len(words)} Words)\n")

    for index, item in enumerate(words, start=1):
        word_id = item["word_id"]
        word = item["word"]
        
        wav_filename = f"{word_id}.wav"
        mp3_filename = f"{word_id}.mp3"
        wav_path = os.path.join(AUDIO_DIR, wav_filename)
        mp3_path = os.path.join(AUDIO_DIR, mp3_filename)

        # Check if either WAV or MP3 exists and is non-trivial
        has_wav = os.path.exists(wav_path) and os.path.getsize(wav_path) > 1000
        has_mp3 = os.path.exists(mp3_path) and os.path.getsize(mp3_path) > 1000

        if has_wav or has_mp3:
            actual_url = f"/data/Tr_Eng_Ilkokul/Audio/{wav_filename}" if has_wav else f"/data/Tr_Eng_Ilkokul/Audio/{mp3_filename}"
            if item.get("audioUrl") != actual_url:
                item["audioUrl"] = actual_url
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(words, f, ensure_ascii=False, indent=2)
            print(f"[{index}/{len(words)}] Skipping (Audio exists): {word_id} -> {word}")
            continue

        print(f"[{index}/{len(words)}] Generating TTS: {word_id} -> '{word}'...")

        try:
            # 1. Try Gemini TTS model
            response = client.models.generate_content(
                model="gemini-2.5-flash-preview-tts",
                contents=f"{word}.",
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name="Puck"
                            )
                        )
                    )
                )
            )

            audio_bytes = None
            if response.candidates:
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.data:
                        audio_bytes = part.inline_data.data
                        break

            if audio_bytes:
                save_pcm_as_wav(audio_bytes, wav_path)
                print(f"    Saved WAV file: {wav_path}")
                item["audioUrl"] = f"/data/Tr_Eng_Ilkokul/Audio/{wav_filename}"
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(words, f, ensure_ascii=False, indent=2)
                time.sleep(6.5)  # Delay to respect Gemini API quota
            else:
                raise ValueError("Gemini returned empty audio candidates.")

        except Exception as e:
            print(f"    Gemini TTS failed ({e}). Falling back to Google Translate (gTTS)...")
            try:
                # 2. Fallback to gTTS (standard clean American English accent, completely unlimited)
                tts = gTTS(text=word, lang='en', tld='com')
                tts.save(mp3_path)
                print(f"    Saved MP3 file (gTTS): {mp3_path}")
                item["audioUrl"] = f"/data/Tr_Eng_Ilkokul/Audio/{mp3_filename}"
                with open(JSON_PATH, "w", encoding="utf-8") as f:
                    json.dump(words, f, ensure_ascii=False, indent=2)
                time.sleep(1.0)  # Moderate sleep for gTTS requests
            except Exception as fallback_err:
                print(f"    CRITICAL ERROR: Fallback gTTS also failed for {word_id}: {fallback_err}")

    print("\nAll pronunciation audio files generated and JSON database updated successfully!")

if __name__ == "__main__":
    main()
