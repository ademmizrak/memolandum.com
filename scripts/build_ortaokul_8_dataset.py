import json
import os
import asyncio
import edge_tts
import ssl

try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

RAW_DATA = [
  # 1. Okul Etkinlikleri, Spor, Müzik ve Tiyatro (1 - 32)
  {"id": 1, "section": "school_events", "english": "Goal", "turkish": "Hedef / Amaç / Kale", "example": "Setting a clear daily goal helps you prepare successfully for the LGS exam."},
  {"id": 2, "section": "school_events", "english": "Instructor", "turkish": "Eğitmen / Öğretmen", "example": "Our robotics instructor demonstrated how to program the micro-controller."},
  {"id": 3, "section": "school_events", "english": "Musician", "turkish": "Müzisyen", "example": "The talented young musician played a delicate violin solo."},
  {"id": 4, "section": "school_events", "english": "Script", "turkish": "Senaryo / Tiyatro metni", "example": "The actors rehearsed their lines directly from the theatre script."},
  {"id": 5, "section": "school_events", "english": "Performance", "turkish": "Performans / Gösteri", "example": "The eighth grade orchestra gave an outstanding stage performance."},
  {"id": 6, "section": "school_events", "english": "Costume", "turkish": "Kostüm", "example": "Each student wore a period costume for the historical drama play."},
  {"id": 7, "section": "school_events", "english": "Curtain", "turkish": "Perde", "example": "The red stage curtain opened and the school show began."},
  {"id": 8, "section": "school_events", "english": "Event", "turkish": "Etkinlik / Olay", "example": "The annual science fair is the biggest event of our autumn term."},
  {"id": 9, "section": "school_events", "english": "Stage", "turkish": "Sahne", "example": "The speakers stood confidently on the auditorium stage."},
  {"id": 10, "section": "school_events", "english": "Perform", "turkish": "Gösteri yapmak / Sergilemek", "example": "Students will perform modern dances at the graduation ceremony."},
  {"id": 11, "section": "school_events", "english": "Drop", "turkish": "Düşürmek / Bırakmak", "example": "Be careful during the lab experiment not to drop the glass beaker."},
  {"id": 12, "section": "school_events", "english": "Hit", "turkish": "Vurmak / Çarpmak", "example": "He swung the racket skillfully to hit the tennis ball across the net."},
  {"id": 13, "section": "school_events", "english": "Throw", "turkish": "Atmak (top vb.)", "example": "The pitcher decided to throw the ball directly toward home base."},
  {"id": 14, "section": "school_events", "english": "Catch", "turkish": "Yakalamak (top vb.)", "example": "The goalkeeper leaped into the air to catch the fast football."},
  {"id": 15, "section": "school_events", "english": "Arrange", "turkish": "Düzenlemek / Organize etmek", "example": "Teachers will arrange a mock exam session on Saturday morning."},
  {"id": 16, "section": "school_events", "english": "Set", "turkish": "Kurmak / Hazırlamak (sahneyi)", "example": "The stage crew worked hard to set the lights before the performance."},
  {"id": 17, "section": "school_events", "english": "Participate", "turkish": "Katılmak", "example": "All eighth graders are encouraged to participate in sports tournaments."},
  {"id": 18, "section": "school_events", "english": "Decorate", "turkish": "Süslemek / Dekore etmek", "example": "We decorate our school corridors with bright motivational banners."},
  {"id": 19, "section": "school_events", "english": "Announce", "turkish": "Duyurmak / İlan etmek", "example": "The principal will announce the top contest winners over the speaker."},
  {"id": 20, "section": "school_events", "english": "Achieve", "turkish": "Başarmak / Elde etmek", "example": "With consistent effort and perseverance, you will achieve your dreams."},
  {"id": 21, "section": "school_events", "english": "Able", "turkish": "Yetenekli / Muktedir", "example": "She is able to solve challenging analytical puzzles with ease."},
  {"id": 22, "section": "school_events", "english": "Classical", "turkish": "Klasik", "example": "Listening to classical music helps many students concentrate while studying."},
  {"id": 23, "section": "school_events", "english": "Extreme", "turkish": "Ekstrem / Uç / Aşırı", "example": "Rock climbing and rafting are thrilling extreme sports."},
  {"id": 24, "section": "school_events", "english": "Musical", "turkish": "Müzikal / Müzikle ilgili", "example": "Playing a musical instrument improves memory and focus."},
  {"id": 25, "section": "school_events", "english": "Deep", "turkish": "Derin", "example": "Critical thinking requires deep reflection on complex concepts."},
  {"id": 26, "section": "school_events", "english": "Fit", "turkish": "Zinde / Formda / Uygun", "example": "Jogging three times a week keeps you physically healthy and fit."},
  {"id": 27, "section": "school_events", "english": "Competitive", "turkish": "Rekabetçi", "example": "Our school enters competitive academic leagues across the province."},
  {"id": 28, "section": "school_events", "english": "Determined", "turkish": "Kararlı / Azimli", "example": "He is determined to score full points on the English section."},
  {"id": 29, "section": "school_events", "english": "Talented", "turkish": "Yetenekli / Becerikli", "example": "She is a talented writer who publishes articles in the school paper."},
  {"id": 30, "section": "school_events", "english": "Entertaining", "turkish": "Eğlenceli", "example": "Vocabulary arcade games make revision entertaining and effective."},
  {"id": 31, "section": "school_events", "english": "Powerful", "turkish": "Güçlü / Etkili", "example": "A rich English vocabulary is a powerful asset for your future."},
  {"id": 32, "section": "school_events", "english": "Actually", "turkish": "Aslında / Gerçekte", "example": "The grammar rule is actually much simpler than it appears."},

  # 2. Çevreyi Korumak ve Geliştirmek (33 - 51)
  {"id": 33, "section": "developing_environment", "english": "Environment", "turkish": "Çevre", "example": "We must protect our natural environment by recycling paper and plastic."},
  {"id": 34, "section": "developing_environment", "english": "Respect", "turkish": "Saygı / Saygı duymak", "example": "Mutual respect between teachers and students creates a positive school culture."},
  {"id": 35, "section": "developing_environment", "english": "Responsibility", "turkish": "Sorumluluk", "example": "Preparing for your upcoming exams is your personal responsibility."},
  {"id": 36, "section": "developing_environment", "english": "Safety", "turkish": "Güvenlik / Emniyet", "example": "Always wear safety goggles when conducting chemical experiments."},
  {"id": 37, "section": "developing_environment", "english": "Communication", "turkish": "İletişim", "example": "Honest communication is essential for productive group work."},
  {"id": 38, "section": "developing_environment", "english": "Friendship", "turkish": "Dostluk / Arkadaşlık", "example": "True friendship is built on loyalty, trust, and empathy."},
  {"id": 39, "section": "developing_environment", "english": "Achievement", "turkish": "Başarı", "example": "Graduating with honours was a remarkable personal achievement."},
  {"id": 40, "section": "developing_environment", "english": "Volunteer", "turkish": "Gönüllü", "example": "Many eighth graders volunteer to clean the local community park."},
  {"id": 41, "section": "developing_environment", "english": "Percent", "turkish": "Yüzde", "example": "Over ninety percent of the class passed the mock assessment."},
  {"id": 42, "section": "developing_environment", "english": "Care", "turkish": "Önemsemek / Özen göstermek", "example": "Good citizens care about the welfare of others and the planet."},
  {"id": 43, "section": "developing_environment", "english": "Collect", "turkish": "Toplamak / Biriktirmek", "example": "Students collect used batteries to prevent soil pollution."},
  {"id": 44, "section": "developing_environment", "english": "Develop", "turkish": "Geliştirmek", "example": "Reading English daily helps you develop your cognitive skills."},
  {"id": 45, "section": "developing_environment", "english": "Expect", "turkish": "Beklemek / Ummak", "example": "Teachers expect eighth graders to arrive prepared with their homework."},
  {"id": 46, "section": "developing_environment", "english": "Plant", "turkish": "Dikmek (ağaç/bitki)", "example": "The environment club will plant twenty olive saplings on campus."},
  {"id": 47, "section": "developing_environment", "english": "Behave", "turkish": "Davranmak", "example": "Students should behave respectfully during official school ceremonies."},
  {"id": 48, "section": "developing_environment", "english": "Encourage", "turkish": "Teşvik etmek / Cesaretlendirmek", "example": "Teachers always encourage curious students to ask bold questions."},
  {"id": 49, "section": "developing_environment", "english": "Protect", "turkish": "Korumak", "example": "We should protect public property and wildlife habitats."},
  {"id": 50, "section": "developing_environment", "english": "Responsible", "turkish": "Sorumlu / Sorumluluk sahibi", "example": "Responsible learners organize their time and review their errors."},
  {"id": 51, "section": "developing_environment", "english": "Responsibly", "turkish": "Sorumluca / Sorumluluk bilinciyle", "example": "Act responsibly by switching off electric lights when leaving the room."},

  # 3. Milli ve Dini Günler, Bayramlar ve Kutlamalar (52 - 65)
  {"id": 52, "section": "celebrations_and_holidays", "english": "Celebration", "turkish": "Kutlama", "example": "The national holiday celebration filled the town square with flags."},
  {"id": 53, "section": "celebrations_and_holidays", "english": "Sport", "turkish": "Spor", "example": "Sport teaches teamwork, discipline, and endurance to young people."},
  {"id": 54, "section": "celebrations_and_holidays", "english": "Music", "turkish": "Müzik", "example": "Traditional folk music brings communities together during festivals."},
  {"id": 55, "section": "celebrations_and_holidays", "english": "Drama", "turkish": "Drama / Tiyatro", "example": "Drama classes build public speaking confidence and creative expression."},
  {"id": 56, "section": "celebrations_and_holidays", "english": "Republic", "turkish": "Cumhuriyet", "example": "Our republic guarantees freedom, progress, and equal educational rights."},
  {"id": 57, "section": "celebrations_and_holidays", "english": "National", "turkish": "Milli / Ulusal", "example": "The national anthem echoes proudly across the school courtyard."},
  {"id": 58, "section": "celebrations_and_holidays", "english": "Sovereignty", "turkish": "Egemenlik", "example": "National sovereignty belongs unconditionally to the people."},
  {"id": 59, "section": "celebrations_and_holidays", "english": "Commemoration", "turkish": "Anma / Anma töreni", "example": "The commemoration of Atatürk takes place every tenth of November."},
  {"id": 60, "section": "celebrations_and_holidays", "english": "Youth", "turkish": "Gençlik", "example": "The future prosperity of a nation depends upon its educated youth."},
  {"id": 61, "section": "celebrations_and_holidays", "english": "Democracy", "turkish": "Demokrasi", "example": "Democracy thrives when citizens participate actively and thoughtfully."},
  {"id": 62, "section": "celebrations_and_holidays", "english": "Unity", "turkish": "Birlik / Beraberlik", "example": "Solidarity and unity give our community strength in tough times."},
  {"id": 63, "section": "celebrations_and_holidays", "english": "Victory", "turkish": "Zafer", "example": "The great victory was achieved through bravery and sacrifice."},
  {"id": 64, "section": "celebrations_and_holidays", "english": "Sacrifice", "turkish": "Fedakarlık / Kurban", "example": "Parents make extraordinary sacrifices for their children's education."},
  {"id": 65, "section": "celebrations_and_holidays", "english": "Festival", "turkish": "Festival / Bayram", "example": "The spring festival brings lively cultural dances and games."},

  # 4. Öğretim Programı Değerleri, Eğilimler ve Beceriler (66 - 100)
  {"id": 66, "section": "values_and_skills", "english": "Curiosity", "turkish": "Merak", "example": "Curiosity drives scientific exploration and lifelong learning."},
  {"id": 67, "section": "values_and_skills", "english": "Independence", "turkish": "Bağımsızlık", "example": "Studying independently teaches students self-reliance and focus."},
  {"id": 68, "section": "values_and_skills", "english": "Perseverance", "turkish": "Azim / Sebat", "example": "Success on challenging exams requires diligence and perseverance."},
  {"id": 69, "section": "values_and_skills", "english": "Determination", "turkish": "Kararlılık", "example": "Her strong determination allowed her to master advanced English grammar."},
  {"id": 70, "section": "values_and_skills", "english": "Self-Efficacy", "turkish": "Öz yetkinlik", "example": "High self-efficacy gives students belief in their ability to succeed."},
  {"id": 71, "section": "values_and_skills", "english": "Self-Confidence", "turkish": "Öz güven", "example": "Regular oral practice builds lasting self-confidence in speaking."},
  {"id": 72, "section": "values_and_skills", "english": "Selectivity", "turkish": "Seçicilik", "example": "Careful selectivity in choosing study resources saves valuable time."},
  {"id": 73, "section": "values_and_skills", "english": "Empathy", "turkish": "Empati / Eş duyum", "example": "Showing empathy helps you understand classmates' viewpoints."},
  {"id": 74, "section": "values_and_skills", "english": "Assertiveness", "turkish": "Girişkenlik / Özgüvenli ifade", "example": "Assertiveness means expressing your opinions clearly and politely."},
  {"id": 75, "section": "values_and_skills", "english": "Trust", "turkish": "Güven", "example": "A strong classroom community is founded upon mutual trust."},
  {"id": 76, "section": "values_and_skills", "english": "Playfulness", "turkish": "Oyunsallık", "example": "Gamified learning brings joyful playfulness to vocabulary practice."},
  {"id": 77, "section": "values_and_skills", "english": "Reasoning", "turkish": "Akıl yürütme", "example": "Deductive reasoning helps you eliminate wrong multiple-choice options."},
  {"id": 78, "section": "values_and_skills", "english": "Focus", "turkish": "Odaklanma", "example": "Deep focus during study hours produces much higher retention."},
  {"id": 79, "section": "values_and_skills", "english": "Creativity", "turkish": "Yaratıcılık", "example": "Artistic projects inspire creativity and innovative thinking."},
  {"id": 80, "section": "values_and_skills", "english": "Truth", "turkish": "Gerçek / Hakikat", "example": "In science, researchers seek the objective truth through evidence."},
  {"id": 81, "section": "values_and_skills", "english": "Open Mindedness", "turkish": "Açık fikirlilik", "example": "Open mindedness allows you to appreciate diverse cultural perspectives."},
  {"id": 82, "section": "values_and_skills", "english": "Analyticalness", "turkish": "Analitiklik", "example": "Analyticalness enables learners to break down complex passages easily."},
  {"id": 83, "section": "values_and_skills", "english": "Being Systematic", "turkish": "Sistemli olma", "example": "Being systematic with flashcard reviews guarantees long-term retention."},
  {"id": 84, "section": "values_and_skills", "english": "Questioning", "turkish": "Sorgulama", "example": "Critical questioning leads to deeper comprehension and insight."},
  {"id": 85, "section": "values_and_skills", "english": "Doubting", "turkish": "Şüphe duyma", "example": "Healthy doubting encourages students to verify online claims."},
  {"id": 86, "section": "values_and_skills", "english": "Critical Perspective", "turkish": "Eleştirel bakış açısı", "example": "Developing a critical perspective prevents falling for false news."},
  {"id": 87, "section": "values_and_skills", "english": "Justice", "turkish": "Adalet", "example": "Fairness and justice are fundamental principles in any society."},
  {"id": 88, "section": "values_and_skills", "english": "Diligence", "turkish": "Çalışkanlık", "example": "Diligence in daily homework leads to academic excellence."},
  {"id": 89, "section": "values_and_skills", "english": "Sensitivity", "turkish": "Duyarlılık", "example": "Environmental sensitivity inspires students to plant trees and save water."},
  {"id": 90, "section": "values_and_skills", "english": "Honesty", "turkish": "Dürüstlük", "example": "Honesty is the most admired virtue in personal character."},
  {"id": 91, "section": "values_and_skills", "english": "Aesthetics", "turkish": "Estetik", "example": "The school courtyard was renovated with modern architectural aesthetics."},
  {"id": 92, "section": "values_and_skills", "english": "Compassion", "turkish": "Merhamet", "example": "Showing compassion to stray animals demonstrates kindness of heart."},
  {"id": 93, "section": "values_and_skills", "english": "Modesty", "turkish": "Mütevazılık / Alçakgönüllülük", "example": "True champions demonstrate modesty both in victory and defeat."},
  {"id": 94, "section": "values_and_skills", "english": "Patience", "turkish": "Sabır", "example": "Language mastery requires patience, repetition, and steady practice."},
  {"id": 95, "section": "values_and_skills", "english": "Healthy Living", "turkish": "Sağlıklı yaşam", "example": "Balanced nutrition and sound sleep are pillars of healthy living."},
  {"id": 96, "section": "values_and_skills", "english": "Patriotism", "turkish": "Vatanseverlik", "example": "True patriotism means serving one's country through honest work and education."},
  {"id": 97, "section": "values_and_skills", "english": "Benevolence", "turkish": "Yardımseverlik", "example": "Acts of benevolence make the whole community warmer and kinder."},
  {"id": 98, "section": "values_and_skills", "english": "Self-Awareness", "turkish": "Öz farkındalık", "example": "Self-awareness helps you recognize your strengths and areas to improve."},
  {"id": 99, "section": "values_and_skills", "english": "Self-Regulation", "turkish": "Öz düzenleme", "example": "Good self-regulation prevents distractions during study sessions."},
  {"id": 100, "section": "values_and_skills", "english": "Flexibility", "turkish": "Esneklik", "example": "Cognitive flexibility helps you adapt quickly to new exam formats."}
]

DATA_DIR = "public/data/Tr_Eng_Ortaokul"
AUDIO_DIR = os.path.join(DATA_DIR, "Audio")
JSON_FILE = os.path.join(DATA_DIR, "Ortaokul_8_Sinif_Kelimeleri.json")

os.makedirs(AUDIO_DIR, exist_ok=True)

async def generate_single_audio(idx, word_id, speech_text, mp3_path):
    need_tts = not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 1000
    if not need_tts:
        print(f"[{idx}/100] Audio already exists: {word_id} ({os.path.getsize(mp3_path)} bytes)")
        return True

    for attempt in range(3):
        try:
            communicate = edge_tts.Communicate(speech_text, "en-US-JennyNeural")
            await communicate.save(mp3_path)
            print(f"[{idx}/100] Generated Edge-TTS: {word_id} -> '{speech_text}' ({os.path.getsize(mp3_path)} bytes)")
            return True
        except Exception as e:
            print(f"[{idx}/100] Attempt {attempt+1} failed for {word_id}: {e}")
            await asyncio.sleep(0.5)

    # Fallback to gTTS if edge-tts failed
    try:
        from gtts import gTTS
        tts = gTTS(text=speech_text, lang='en', tld='com')
        tts.save(mp3_path)
        print(f"[{idx}/100] Fallback gTTS: {word_id} -> '{speech_text}' ({os.path.getsize(mp3_path)} bytes)")
        return True
    except Exception as e2:
        print(f"[{idx}/100] Fallback gTTS failed for {word_id}: {e2}")

    print(f"[ERROR] Failed to generate TTS for {word_id}")
    return False

async def main():
    dataset = []
    print(f"Total words to process: {len(RAW_DATA)}")

    for idx, item in enumerate(RAW_DATA, start=1):
        word_id = f"w_{80000 + idx}"
        english = item["english"]
        turkish = item["turkish"]
        example = item["example"]
        section = item["section"]

        mp3_name = f"{word_id}.mp3"
        mp3_path = os.path.join(AUDIO_DIR, mp3_name)
        audio_url = f"/data/Tr_Eng_Ortaokul/Audio/{mp3_name}"

        await generate_single_audio(idx, word_id, english, mp3_path)

        entry = {
            "word_id": word_id,
            "id": word_id,
            "word": english,
            "english": english,
            "translation": turkish,
            "turkish": turkish,
            "meaning": turkish,
            "cefr_level": "B1",
            "curriculum": {
                "system": "MEB",
                "grades": [8],
                "units": [
                    {
                        "grade": 8,
                        "unit_no": 1,
                        "unit_name": "School Life & Education"
                    }
                ]
            },
            "tags": [
                section,
                "school_life_and_education",
                "meb_curriculum",
                "grade_8",
                "unit_1",
                "lgs"
            ],
            "example_sentence": example,
            "audioUrl": audio_url
        }
        dataset.append(entry)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully generated {len(dataset)} items in {JSON_FILE}!")

if __name__ == "__main__":
    asyncio.run(main())
