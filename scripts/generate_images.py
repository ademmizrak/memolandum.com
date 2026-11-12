import json
import os
import time
from io import BytesIO
from PIL import Image
from google import genai
from google.genai import types

# 1. Antigravity / Google AI Studio API Key Kontrolü
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
    raise ValueError("[HATA] Environment degiskenlerinde GEMINI_API_KEY veya GOOGLE_API_KEY bulunamadi!")

client = genai.Client(api_key=api_key)

OUTPUT_DIR = "./public/assets/words"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 2. Özel Durumlar İçin Pedagojik Prompt Haritası (SPECIAL_PROMPTS)
SPECIAL_PROMPTS = {
    # Letters
    "a": "A cute, colorful, friendly cartoon letter 'A' with small eyes and a smile, 2D vector style, bright colors, white background",
    "b": "A cute, colorful, friendly cartoon letter 'B' with small eyes and a smile, 2D vector style, bright colors, white background",
    "c": "A cute, colorful, friendly cartoon letter 'C' with small eyes and a smile, 2D vector style, bright colors, white background",
    
    # Colors
    "red": "A vibrant red paint splash and a cute red balloon, 2D flat vector, bright red color, white background",
    "blue": "A vibrant blue paint splash and a cute blue balloon, 2D flat vector, bright blue color, white background",
    "yellow": "A vibrant yellow paint splash and a cute yellow balloon, 2D flat vector, bright yellow color, white background",
    "green": "A vibrant green paint splash and a cute green balloon, 2D flat vector, bright green color, white background",
    "orange": "A vibrant orange paint splash and a cute orange balloon, 2D flat vector, bright orange color, white background",
    "purple": "A vibrant purple paint splash and a cute purple balloon, 2D flat vector, bright purple color, white background",
    "pink": "A vibrant pink paint splash and a cute pink balloon, 2D flat vector, bright pink color, white background",
    "black": "A vibrant black paint splash and a cute black balloon, 2D flat vector, black color, white background",
    "white": "A cute white fluffy cloud on a soft light-blue circular badge background, 2D flat vector, white color highlighted, white background",
    "brown": "A vibrant brown paint splash and a cute brown balloon, 2D flat vector, brown color, white background",
    
    # Greetings & Social
    "hello": "Two cute children waving their hands happily, greeting each other, 2D flat vector cartoon, bright colors, white background",
    "hi": "Two cute children waving their hands happily, greeting each other, 2D flat vector cartoon, bright colors, white background",
    "goodbye": "A cute child waving goodbye with a backpack, walking away, 2D flat vector cartoon, bright colors, white background",
    "bye": "A cute child waving goodbye with a backpack, walking away, 2D flat vector cartoon, bright colors, white background",
    "good morning": "A smiling cute sun rising over hills, morning scene, 2D flat vector cartoon, bright colors, white background",
    "good afternoon": "A smiling bright sun shining in a clear blue sky with fluffy clouds, 2D flat vector cartoon, bright colors, white background",
    "good evening": "A beautiful warm sunset behind rolling green hills, peaceful evening scene, 2D flat vector cartoon, bright colors, white background",
    "good night": "A sleeping smiling moon and small stars in a dark night sky circle, 2D flat vector cartoon, white background",
    "welcome": "A friendly teacher welcoming children at the classroom door, 2D flat vector cartoon, bright colors, white background",
    
    # Basic words & Pronouns
    "I": "A cute cartoon kid pointing at themselves with a big smile, 2D flat vector cartoon, bright colors, white background",
    "you": "A cute cartoon kid pointing forward with a big smile, 2D flat vector cartoon, bright colors, white background",
    "yes": "A friendly green checkmark icon with a smiling face, 2D flat vector cartoon, white background",
    "no": "A friendly red cross icon with a cartoon face, 2D flat vector cartoon, white background",
    
    # Verbs / Actions
    "listen": "A cute cartoon ear or a child cups hand to ear to listen attentively, 2D flat vector cartoon, bright colors, white background",
    "look": "A pair of large friendly binoculars or a magnifying glass focusing on something, 2D flat vector cartoon, bright colors, white background",
    "sing": "A cute little bird singing notes from its beak, 2D flat vector cartoon, bright colors, white background",
    "dance": "A cute happy boy and girl dancing joyfully, 2D flat vector cartoon, bright colors, white background",
    "jump": "A cute happy child jumping high in the air with joy, 2D flat vector cartoon, bright colors, white background",
    "run": "A cute child running happily in sneakers, 2D flat vector cartoon, bright colors, white background",
    "stop": "A cute friendly red stop sign hand icon, 2D flat vector cartoon, white background",
    "draw": "A hand drawing a colorful picture with a crayon, 2D flat vector cartoon, bright colors, white background",
    "color": "A set of colorful crayons coloring a page, 2D flat vector cartoon, bright colors, white background",
    "play": "A pile of toys including a ball, toy car, and blocks, 2D flat vector cartoon, bright colors, white background",
    "open": "An open cardboard box or an open book, 2D flat vector cartoon, bright colors, white background",
    "close": "A closed cardboard box with a ribbon or a closed book, 2D flat vector cartoon, bright colors, white background",
    "stand up": "An arrow pointing up next to a child rising from a chair, 2D flat vector cartoon, bright colors, white background",
    "sit down": "An arrow pointing down next to a child sitting on a chair, 2D flat vector cartoon, bright colors, white background",
    "happy": "A very happy yellow smiley face, 2D flat vector cartoon, bright colors, white background",
    "sad": "A sad blue cartoon face with a tear, 2D flat vector cartoon, white background",
    "big": "A large elephant standing next to a tiny mouse for comparison, 2D flat vector cartoon, bright colors, white background",
    "small": "A tiny mouse standing next to a large elephant for comparison, 2D flat vector cartoon, bright colors, white background",
    "cut": "A pair of friendly cartoon scissors cutting a sheet of colored paper, 2D flat vector cartoon, bright colors, white background",
    "glue": "A cute cartoon glue stick standing and smiling, 2D flat vector cartoon, bright colors, white background",
    "eleven": "Cute cartoon numbers '11' with small eyes and a smile, 2D flat vector style, bright colors, white background",
    "twelve": "Cute cartoon numbers '12' with small eyes and a smile, 2D flat vector style, bright colors, white background",
    "count": "A cute cartoon hand pointing at numbers 1, 2, 3, 2D flat vector style, bright colors, white background",
    "how many": "A collection of cute cartoon apples with a question mark, 2D flat vector style, bright colors, white background",
    "candles": "A set of colorful smiling birthday candles lit up, 2D flat vector cartoon, bright colors, white background",
    "slide": "A cute colorful kids playground slide, 2D flat vector cartoon, bright colors, white background",
    "swing": "A cute wooden playground swing hanging from a green tree branch, 2D flat vector cartoon, bright colors, white background",
    "seesaw": "A cute colorful playground seesaw (teeter-totter), 2D flat vector cartoon, bright colors, white background",
    "rope": "A neatly coiled thick cartoon rope, 2D flat vector cartoon, bright colors, white background",
    "skip rope": "A colorful cartoon jump rope with handles, 2D flat vector cartoon, bright colors, white background",
    "touch": "A hand gently touching a soft glowing star, 2D flat vector cartoon, bright colors, white background",
    "point": "A friendly cartoon hand pointing index finger to the right, 2D flat vector cartoon, bright colors, white background",
    "like": "A glowing pink cartoon heart badge, friendly and warm, 2D flat vector cartoon, white background",
    "fly": "A cute smiling bird flying happily in the sky, 2D flat vector cartoon, bright colors, white background",
    "swim": "A cute smiling fish swimming happily in blue water waves, 2D flat vector cartoon, bright colors, white background",
}

def get_prompt_for_word(word: str) -> str:
    """Kelimeye özel prompt varsa onu döndürür, yoksa varsayılan şablonu uygular."""
    word_lower = word.lower().strip()
    if word_lower in SPECIAL_PROMPTS:
        return SPECIAL_PROMPTS[word_lower]
    
    # Standart Somut Nesne Şablonu
    return (
        f"A cute, vibrant 2D flat vector icon illustration of '{word}' for a primary school learning app (age 6-7), "
        f"bright colors, friendly cartoon style, minimalist, isolated on clean solid white background, high quality, no text, no letters."
    )

# 3. Batch İşlemi
def main():
    json_path = "public/data/Tr_Eng_Ilkokul/Ilkokul_2_Sinif_Kelimeleri.json"
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"[HATA] '{json_path}' dosyasi bulunamadi! Lutfen kok dizine eklendiginden emin olun.")

    with open(json_path, "r", encoding="utf-8") as f:
        words = json.load(f)

    if os.getenv("TEST_RUN") == "1":
        print("[TEST] TEST MODU AKTIF: Sadece 'a' ve 'apple' kelimeleri uretilecektir.\n")
        words = [w for w in words if w["word"] in ["a", "apple"]]

    print(f"[START] Memolandum Imagen 3 Pipeline Baslatiliyor... (Toplam {len(words)} Kelime)\n")

    for index, item in enumerate(words, start=1):
        word_id = item["word_id"]
        word = item["word"]
        file_path = os.path.join(OUTPUT_DIR, f"{word_id}.png")

        # Idempotency Kontrolü
        if os.path.exists(file_path):
            print(f"[{index}/{len(words)}] [SKIP] (Zaten mevcut): {word_id} ({word})")
            continue

        prompt = get_prompt_for_word(word)
        print(f"[{index}/{len(words)}] [GENERATE] Uretiliyor: {word_id} -> '{word}'...")

        success = False
        retries = 3
        for attempt in range(retries):
            try:
                response = client.models.generate_content(
                    model="gemini-3.1-flash-image",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE"],
                        image_config=types.ImageConfig(
                            aspect_ratio="1:1"
                        )
                    )
                )

                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        image = Image.open(BytesIO(part.inline_data.data))
                        image.save(file_path, "PNG")
                        print(f"    [SUCCESS] Basariyla kaydedildi: {file_path}")
                        success = True
                        break

                if success:
                    break

            except Exception as e:
                print(f"    [WARN] Deneme {attempt + 1}/{retries} basarisiz ({word_id}): {e}")
                time.sleep(2 ** attempt)

        if not success:
            print(f"    [ERROR] {word_id} ({word}) uretilemedi.")

        # Rate Limit Koruması (AI Studio Kotaları için)
        time.sleep(1.5)

    print("\n[FINISH] Tum kelimelerin gorselleri Google Native Imagen 3 ile tamamlandi!")

if __name__ == "__main__":
    main()
