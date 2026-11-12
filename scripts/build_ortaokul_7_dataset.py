import json
import os
import asyncio
import edge_tts

RAW_DATA = [
  # Theme 1: School Life & Education (1 - 50)
  {"id": 1, "unit": 1, "theme": "School Life & Education", "english": "A drama play", "turkish": "Tiyatro oyunu", "speech": "A drama play", "example": "Our school drama club will stage a drama play next Friday."},
  {"id": 2, "unit": 1, "theme": "School Life & Education", "english": "A drawing", "turkish": "Çizim / Resim", "speech": "A drawing", "example": "She created a colourful drawing of our school garden."},
  {"id": 3, "unit": 1, "theme": "School Life & Education", "english": "Football (Soccer)", "turkish": "Futbol", "speech": "Football, Soccer", "example": "We play football on the school field every afternoon."},
  {"id": 4, "unit": 1, "theme": "School Life & Education", "english": "An exhibition", "turkish": "Sergi", "speech": "An exhibition", "example": "Students displayed their science models at the annual exhibition."},
  {"id": 5, "unit": 1, "theme": "School Life & Education", "english": "A congratulation", "turkish": "Tebrik / Kutlama", "speech": "A congratulation", "example": "The teacher sent a warm congratulation to the quiz winner."},
  {"id": 6, "unit": 1, "theme": "School Life & Education", "english": "To act", "turkish": "Rol yapmak / Oynamak", "speech": "To act", "example": "Ali loves to act in front of an enthusiastic audience."},
  {"id": 7, "unit": 1, "theme": "School Life & Education", "english": "To attend", "turkish": "Katılmak", "speech": "To attend", "example": "All seventh graders must attend the morning seminar."},
  {"id": 8, "unit": 1, "theme": "School Life & Education", "english": "To be keen (on)", "turkish": "Bir şeye düşkün / meraklı olmak", "speech": "To be keen on", "example": "Zeynep is keen on learning foreign languages and coding."},
  {"id": 9, "unit": 1, "theme": "School Life & Education", "english": "Fun", "turkish": "Eğlenceli", "speech": "Fun", "example": "Language learning games make vocabulary practice really fun."},
  {"id": 10, "unit": 1, "theme": "School Life & Education", "english": "Religious", "turkish": "Dini", "speech": "Religious", "example": "We celebrate both national and religious festivals joyfully."},
  {"id": 11, "unit": 1, "theme": "School Life & Education", "english": "Casual (clothes)", "turkish": "Gündelik / Günlük (kıyafetler)", "speech": "Casual clothes", "example": "Students wore casual clothes on the charity day."},
  {"id": 12, "unit": 1, "theme": "School Life & Education", "english": "Talented", "turkish": "Yetenekli", "speech": "Talented", "example": "Our school has many talented musicians and young athletes."},
  {"id": 13, "unit": 1, "theme": "School Life & Education", "english": "An ability", "turkish": "Yetenek / Beceri", "speech": "An ability", "example": "Solving complex puzzles requires sharp problem-solving ability."},
  {"id": 14, "unit": 1, "theme": "School Life & Education", "english": "An audience", "turkish": "Seyirci / Dinleyici kitlesi", "speech": "An audience", "example": "The audience applauded loudly at the end of the choir concert."},
  {"id": 15, "unit": 1, "theme": "School Life & Education", "english": "A competition", "turkish": "Yarışma", "speech": "A competition", "example": "Our class entered the inter-school robotic coding competition."},
  {"id": 16, "unit": 1, "theme": "School Life & Education", "english": "First", "turkish": "Birinci / İlk", "speech": "First", "example": "She finished first in the hundred-metre school race."},
  {"id": 17, "unit": 1, "theme": "School Life & Education", "english": "An organization", "turkish": "Organizasyon / Düzenleme", "speech": "An organization", "example": "The sports tournament was an impressive school organization."},
  {"id": 18, "unit": 1, "theme": "School Life & Education", "english": "A winner", "turkish": "Kazanan / Birinci", "speech": "A winner", "example": "The principal congratulated the winner of the essay contest."},
  {"id": 19, "unit": 1, "theme": "School Life & Education", "english": "A prize", "turkish": "Ödül", "speech": "A prize", "example": "The top team received a shining golden trophy as a prize."},
  {"id": 20, "unit": 1, "theme": "School Life & Education", "english": "A finish", "turkish": "Bitiş", "speech": "A finish", "example": "He ran faster as he approached the race finish line."},
  {"id": 21, "unit": 1, "theme": "School Life & Education", "english": "A start", "turkish": "Başlangıç", "speech": "A start", "example": "September marks the exciting start of the new academic term."},
  {"id": 22, "unit": 1, "theme": "School Life & Education", "english": "A choice", "turkish": "Seçim / Tercih", "speech": "A choice", "example": "Joining the art club was a wonderful choice for her."},
  {"id": 23, "unit": 1, "theme": "School Life & Education", "english": "To beat", "turkish": "Yenmek / Galip gelmek", "speech": "To beat", "example": "Our basketball team worked together to beat the rivals."},
  {"id": 24, "unit": 1, "theme": "School Life & Education", "english": "To celebrate", "turkish": "Kutlamak", "speech": "To celebrate", "example": "We gathered to celebrate our high exam scores together."},
  {"id": 25, "unit": 1, "theme": "School Life & Education", "english": "To race", "turkish": "Yarışmak", "speech": "To race", "example": "Students were eager to race across the sports track."},
  {"id": 26, "unit": 1, "theme": "School Life & Education", "english": "To blow (up)", "turkish": "Üflemek / Balon şişirmek", "speech": "To blow up", "example": "We helped blow up colourful balloons to decorate the hall."},
  {"id": 27, "unit": 1, "theme": "School Life & Education", "english": "To break a record", "turkish": "Rekor kırmak", "speech": "To break a record", "example": "The young swimmer trained hard to break a national record."},
  {"id": 28, "unit": 1, "theme": "School Life & Education", "english": "Excellent", "turkish": "Mükemmel / Harika", "speech": "Excellent", "example": "Your English pronunciation during the presentation was excellent."},
  {"id": 29, "unit": 1, "theme": "School Life & Education", "english": "Fair", "turkish": "Adil / Dürüst", "speech": "Fair", "example": "A good referee always makes fair decisions during a game."},
  {"id": 30, "unit": 1, "theme": "School Life & Education", "english": "Fascinating", "turkish": "Büyüleyici / Çok etkileyici", "speech": "Fascinating", "example": "Our science teacher shared fascinating facts about outer space."},
  {"id": 31, "unit": 1, "theme": "School Life & Education", "english": "Fortunately", "turkish": "Neyse ki / Şans eseri", "speech": "Fortunately", "example": "Fortunately, the rain stopped right before our outdoor match."},
  {"id": 32, "unit": 1, "theme": "School Life & Education", "english": "Last", "turkish": "Sonuncu / Son", "speech": "Last", "example": "This is the last lesson of our busy school timetable."},
  {"id": 33, "unit": 1, "theme": "School Life & Education", "english": "Extra-curricular activity", "turkish": "Okul kulüp / Müfredat dışı etkinlik", "speech": "Extra-curricular activity", "example": "Playing chess is my favourite extra-curricular activity."},
  {"id": 34, "unit": 1, "theme": "School Life & Education", "english": "29 October Republic Day", "turkish": "29 Ekim Cumhuriyet Bayramı", "speech": "Twenty ninth of October Republic Day", "example": "We proudly celebrate 29 October Republic Day with flags and poems."},
  {"id": 35, "unit": 1, "theme": "School Life & Education", "english": "23 April National Sovereignty and Children's Day", "turkish": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı", "speech": "Twenty third of April National Sovereignty and Children's Day", "example": "Children perform folk dances on 23 April National Sovereignty Day."},
  {"id": 36, "unit": 1, "theme": "School Life & Education", "english": "19 May Commemoration of Atatürk, Youth and Sports Day", "turkish": "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı", "speech": "Nineteenth of May Commemoration of Atatürk, Youth and Sports Day", "example": "Youth across the nation celebrate 19 May with athletic shows."},
  {"id": 37, "unit": 1, "theme": "School Life & Education", "english": "15 July Democracy and National Unity Day", "turkish": "15 Temmuz Demokrasi ve Milli Birlik Günü", "speech": "Fifteenth of July Democracy and National Unity Day", "example": "We commemorate 15 July Democracy Day with respect."},
  {"id": 38, "unit": 1, "theme": "School Life & Education", "english": "30 August Victory Day", "turkish": "30 Ağustos Zafer Bayramı", "speech": "Thirtieth of August Victory Day", "example": "A grand military parade takes place on 30 August Victory Day."},
  {"id": 39, "unit": 1, "theme": "School Life & Education", "english": "Eid al-Fitr (Eid al-Ramadan)", "turkish": "Ramazan Bayramı", "speech": "Eid al-Fitr, Eid al-Ramadan", "example": "Families visit relatives and share traditional sweets during Eid al-Fitr."},
  {"id": 40, "unit": 1, "theme": "School Life & Education", "english": "Festival of Sacrifice (Eid al-Adha)", "turkish": "Kurban Bayramı", "speech": "Festival of Sacrifice, Eid al-Adha", "example": "People share food and show charity during the Festival of Sacrifice."},
  {"id": 41, "unit": 1, "theme": "School Life & Education", "english": "Timetable", "turkish": "Ders programı", "speech": "Timetable", "example": "Check the weekly timetable to prepare the right school books."},
  {"id": 42, "unit": 1, "theme": "School Life & Education", "english": "Non-uniform day", "turkish": "Serbest kıyafet günü", "speech": "Non-uniform day", "example": "Students are excited to wear their casual sweaters on non-uniform day."},
  {"id": 43, "unit": 1, "theme": "School Life & Education", "english": "Line leader", "turkish": "Sıra lideri", "speech": "Line leader", "example": "The line leader guides classmates quietly into the assembly hall."},
  {"id": 44, "unit": 1, "theme": "School Life & Education", "english": "Must (rule/obligation)", "turkish": "-malı / -meli (Zorunluluk/Kural)", "speech": "Must", "example": "You must listen to the teacher attentively during the lesson."},
  {"id": 45, "unit": 1, "theme": "School Life & Education", "english": "Can't (prohibition)", "turkish": "Yapamaz (Yasaklama)", "speech": "Can't", "example": "Students can't use mobile phones during classroom exams."},
  {"id": 46, "unit": 1, "theme": "School Life & Education", "english": "Adverbs of frequency", "turkish": "Sıklık zarfları (always, rarely vb.)", "speech": "Adverbs of frequency", "example": "Words like always, usually, and rarely are adverbs of frequency."},
  {"id": 47, "unit": 1, "theme": "School Life & Education", "english": "Simple Present Tense", "turkish": "Geniş Zaman", "speech": "Simple Present Tense", "example": "We use the Simple Present Tense to describe our daily routines."},
  {"id": 48, "unit": 1, "theme": "School Life & Education", "english": "Present Progressive Tense", "turkish": "Şimdiki Zaman", "speech": "Present Progressive Tense", "example": "The Present Progressive Tense expresses actions happening right now."},
  {"id": 49, "unit": 1, "theme": "School Life & Education", "english": "Intonation", "turkish": "Ses vurgusu / Tonlama", "speech": "Intonation", "example": "Proper intonation makes your spoken English sound natural and clear."},
  {"id": 50, "unit": 1, "theme": "School Life & Education", "english": "Performance assignment", "turkish": "Performans ödevi", "speech": "Performance assignment", "example": "We researched historical inventions for our term performance assignment."},

  # Theme 2: Classroom Life & Learning (51 - 100)
  {"id": 51, "unit": 2, "theme": "Classroom Life & Learning", "english": "An app (application)", "turkish": "Uygulama", "speech": "An app, application", "example": "This vocabulary app helps me revise fifty English words a day."},
  {"id": 52, "unit": 2, "theme": "Classroom Life & Learning", "english": "A mobile device", "turkish": "Taşınabilir / Mobil cihaz", "speech": "A mobile device", "example": "You can connect your mobile device to the school's smart projector."},
  {"id": 53, "unit": 2, "theme": "Classroom Life & Learning", "english": "A laptop", "turkish": "Dizüstü bilgisayar", "speech": "A laptop", "example": "He carries a lightweight laptop for his digital assignments."},
  {"id": 54, "unit": 2, "theme": "Classroom Life & Learning", "english": "A printer", "turkish": "Yazıcı", "speech": "A printer", "example": "The secretary used the printer to produce the project handouts."},
  {"id": 55, "unit": 2, "theme": "Classroom Life & Learning", "english": "A screen", "turkish": "Ekran", "speech": "A screen", "example": "Look at the interactive screen to see the grammatical table."},
  {"id": 56, "unit": 2, "theme": "Classroom Life & Learning", "english": "A speaker", "turkish": "Hoparlör", "speech": "A speaker", "example": "The teacher turned on the speaker so everyone could hear the audio."},
  {"id": 57, "unit": 2, "theme": "Classroom Life & Learning", "english": "A tablet", "turkish": "Tablet", "speech": "A tablet", "example": "We read interactive digital storybooks on our classroom tablet."},
  {"id": 58, "unit": 2, "theme": "Classroom Life & Learning", "english": "A tool", "turkish": "Araç / Gereç", "speech": "A tool", "example": "The internet is a powerful learning tool when used wisely."},
  {"id": 59, "unit": 2, "theme": "Classroom Life & Learning", "english": "A website", "turkish": "Web sitesi", "speech": "A website", "example": "Memolandum is an educational website designed for fun language learning."},
  {"id": 60, "unit": 2, "theme": "Classroom Life & Learning", "english": "A code", "turkish": "Kod / Şifre", "speech": "A code", "example": "In technology class, seventh graders write Python code."},
  {"id": 61, "unit": 2, "theme": "Classroom Life & Learning", "english": "An error", "turkish": "Hata", "speech": "An error", "example": "Learning from a grammar error helps you become a better speaker."},
  {"id": 62, "unit": 2, "theme": "Classroom Life & Learning", "english": "Electricity", "turkish": "Elektrik", "speech": "Electricity", "example": "Solar panels generate clean electricity for our modern school."},
  {"id": 63, "unit": 2, "theme": "Classroom Life & Learning", "english": "A virus", "turkish": "Virüs", "speech": "A virus", "example": "Keep your computer protected against any malicious digital virus."},
  {"id": 64, "unit": 2, "theme": "Classroom Life & Learning", "english": "External memory", "turkish": "Harici bellek / USB bellek", "speech": "External memory", "example": "I backed up my multimedia presentation on an external memory stick."},
  {"id": 65, "unit": 2, "theme": "Classroom Life & Learning", "english": "To connect", "turkish": "Bağlanmak", "speech": "To connect", "example": "Our tablets connect quickly to the secure school Wi-Fi network."},
  {"id": 66, "unit": 2, "theme": "Classroom Life & Learning", "english": "To print", "turkish": "Yazdırmak / Çıktı almak", "speech": "To print", "example": "Please print two copies of the reading worksheet."},
  {"id": 67, "unit": 2, "theme": "Classroom Life & Learning", "english": "Digital", "turkish": "Dijital / Sayısal", "speech": "Digital", "example": "Digital flashcards make reviewing vocabulary much more effective."},
  {"id": 68, "unit": 2, "theme": "Classroom Life & Learning", "english": "A circle", "turkish": "Daire / Çember", "speech": "A circle", "example": "Draw a neat circle around the correct multiple-choice option."},
  {"id": 69, "unit": 2, "theme": "Classroom Life & Learning", "english": "A cross", "turkish": "Çarpı işareti", "speech": "A cross", "example": "Put a cross next to the statements that are not true."},
  {"id": 70, "unit": 2, "theme": "Classroom Life & Learning", "english": "A decision", "turkish": "Karar", "speech": "A decision", "example": "Choosing your study schedule is an important personal decision."},
  {"id": 71, "unit": 2, "theme": "Classroom Life & Learning", "english": "A discussion", "turkish": "Tartışma", "speech": "A discussion", "example": "Our English class had an engaging discussion about online safety."},
  {"id": 72, "unit": 2, "theme": "Classroom Life & Learning", "english": "A memory", "turkish": "Hafıza / Anı", "speech": "A memory", "example": "Playing educational games strengthens your long-term memory."},
  {"id": 73, "unit": 2, "theme": "Classroom Life & Learning", "english": "A speech", "turkish": "Konuşma / Nutuk", "speech": "A speech", "example": "The headmaster delivered an inspiring speech at graduation."},
  {"id": 74, "unit": 2, "theme": "Classroom Life & Learning", "english": "A context", "turkish": "Bağlam / Metin çevresi", "speech": "A context", "example": "Always try to guess the meaning of new words in their context."},
  {"id": 75, "unit": 2, "theme": "Classroom Life & Learning", "english": "A degree", "turkish": "Derece", "speech": "A degree", "example": "The classroom thermometer shows twenty-two degrees Celsius."},
  {"id": 76, "unit": 2, "theme": "Classroom Life & Learning", "english": "Understanding", "turkish": "Anlayış / Kavrama", "speech": "Understanding", "example": "Reading authentic articles improves your reading understanding."},
  {"id": 77, "unit": 2, "theme": "Classroom Life & Learning", "english": "Streaming", "turkish": "Canlı yayın / Veri akışı", "speech": "Streaming", "example": "The teacher showed a live streaming video of the space station."},
  {"id": 78, "unit": 2, "theme": "Classroom Life & Learning", "english": "Household", "turkish": "Ev halkı / Ev içi", "speech": "Household", "example": "Every member of the household shares the daily chores."},
  {"id": 79, "unit": 2, "theme": "Classroom Life & Learning", "english": "To circle", "turkish": "Daire içine almak", "speech": "To circle", "example": "Please circle all the irregular verbs in this short story."},
  {"id": 80, "unit": 2, "theme": "Classroom Life & Learning", "english": "To express", "turkish": "İfade etmek", "speech": "To express", "example": "Learning English gives you the power to express your ideas globally."},
  {"id": 81, "unit": 2, "theme": "Classroom Life & Learning", "english": "To succeed", "turkish": "Başarmak", "speech": "To succeed", "example": "If you study consistently, you will surely succeed in school."},
  {"id": 82, "unit": 2, "theme": "Classroom Life & Learning", "english": "To present", "turkish": "Sunmak / Sunum yapmak", "speech": "To present", "example": "Our team will present the geography findings tomorrow."},
  {"id": 83, "unit": 2, "theme": "Classroom Life & Learning", "english": "To pronounce", "turkish": "Telaffuz etmek", "speech": "To pronounce", "example": "Listen carefully to the audio to pronounce English sounds accurately."},
  {"id": 84, "unit": 2, "theme": "Classroom Life & Learning", "english": "To be good at", "turkish": "Bir konuda iyi olmak", "speech": "To be good at", "example": "Mert is good at solving difficult algebraic equations."},
  {"id": 85, "unit": 2, "theme": "Classroom Life & Learning", "english": "To be bad at", "turkish": "Bir konuda kötü olmak", "speech": "To be bad at", "example": "Nobody is born bad at languages; regular practice always helps."},
  {"id": 86, "unit": 2, "theme": "Classroom Life & Learning", "english": "To play a critical role", "turkish": "Kritik bir rol oynamak", "speech": "To play a critical role", "example": "Daily reading plays a critical role in vocabulary acquisition."},
  {"id": 87, "unit": 2, "theme": "Classroom Life & Learning", "english": "Correctly", "turkish": "Doğru bir şekilde", "speech": "Correctly", "example": "She answered all ten challenge questions correctly."},
  {"id": 88, "unit": 2, "theme": "Classroom Life & Learning", "english": "Sure", "turkish": "Emin / Elbette", "speech": "Sure", "example": "I am sure you will do great on your upcoming English test."},
  {"id": 89, "unit": 2, "theme": "Classroom Life & Learning", "english": "Confusing", "turkish": "Kafa karıştırıcı / Karmaşık", "speech": "Confusing", "example": "The math riddle seemed confusing at first, but we figured it out."},
  {"id": 90, "unit": 2, "theme": "Classroom Life & Learning", "english": "Cardinal numbers (500-1000)", "turkish": "Sayma sayıları (500-1000)", "speech": "Cardinal numbers from five hundred to one thousand", "example": "Seventh grade students practice reading cardinal numbers up to one thousand."},
  {"id": 91, "unit": 2, "theme": "Classroom Life & Learning", "english": "Ordinal numbers (50-100)", "turkish": "Sıra sayıları (50th-100th)", "speech": "Ordinal numbers from fiftieth to one hundredth", "example": "We learned ordinal numbers such as fiftieth and hundredth in class."},
  {"id": 92, "unit": 2, "theme": "Classroom Life & Learning", "english": "To fix", "turkish": "Düzeltmek / Onarmak", "speech": "To fix", "example": "The technician arrived to fix the malfunctioning printer."},
  {"id": 93, "unit": 2, "theme": "Classroom Life & Learning", "english": "Will (for help)", "turkish": "Gelecek zaman eki (Yardım teklifi)", "speech": "Will", "example": "Don't worry about those heavy books; I will carry them for you."},
  {"id": 94, "unit": 2, "theme": "Classroom Life & Learning", "english": "Question tags", "turkish": "Onay soruları (don't you?, aren't they?)", "speech": "Question tags", "example": "You like playing arcade vocabulary games, don't you?"},
  {"id": 95, "unit": 2, "theme": "Classroom Life & Learning", "english": "No cutting corners", "turkish": "Kolaya kaçmamak / Kestirmeden gitmemek", "speech": "No cutting corners", "example": "Real success takes dedication and hard work, no cutting corners."},
  {"id": 96, "unit": 2, "theme": "Classroom Life & Learning", "english": "Do your best", "turkish": "Elinden gelenin en iyisini yapmak", "speech": "Do your best", "example": "Always do your best and stay confident during your presentations."},
  {"id": 97, "unit": 2, "theme": "Classroom Life & Learning", "english": "Throw in the towel", "turkish": "Pes etmek / Pes bayrağı çekmek", "speech": "Throw in the towel", "example": "Never throw in the towel when faced with a difficult challenge."},
  {"id": 98, "unit": 2, "theme": "Classroom Life & Learning", "english": "Slow down", "turkish": "Yavaşlamak", "speech": "Slow down", "example": "Slow down and read the exam questions carefully before answering."},
  {"id": 99, "unit": 2, "theme": "Classroom Life & Learning", "english": "Double-check", "turkish": "Tekrar kontrol etmek", "speech": "Double-check", "example": "Always double-check your answers before submitting your quiz."},
  {"id": 100, "unit": 2, "theme": "Classroom Life & Learning", "english": "Schedule", "turkish": "Plan / Zaman çizelgesi", "speech": "Schedule", "example": "A balanced daily study schedule leaves plenty of time for hobbies."}
]

DATA_DIR = "public/data/Tr_Eng_Ortaokul"
AUDIO_DIR = os.path.join(DATA_DIR, "Audio")
JSON_FILE = os.path.join(DATA_DIR, "Ortaokul_7_Sinif_Kelimeleri.json")

os.makedirs(AUDIO_DIR, exist_ok=True)

import ssl
try:
    ssl._create_default_https_context = ssl._create_unverified_context
except Exception:
    pass

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
        word_id = f"w_{70000 + idx}"
        english = item["english"]
        turkish = item["turkish"]
        example = item["example"]
        unit_no = item["unit"]
        unit_name = item["theme"]
        speech_text = item.get("speech", english)

        mp3_name = f"{word_id}.mp3"
        mp3_path = os.path.join(AUDIO_DIR, mp3_name)
        audio_url = f"/data/Tr_Eng_Ortaokul/Audio/{mp3_name}"

        await generate_single_audio(idx, word_id, speech_text, mp3_path)

        entry = {
            "word_id": word_id,
            "id": word_id,
            "word": english,
            "english": english,
            "translation": turkish,
            "turkish": turkish,
            "meaning": turkish,
            "cefr_level": "A2",
            "curriculum": {
                "system": "MEB",
                "grades": [7],
                "units": [
                    {
                        "grade": 7,
                        "unit_no": unit_no,
                        "unit_name": unit_name
                    }
                ]
            },
            "tags": [
                unit_name.lower().replace(" ", "_").replace("&", "and"),
                "meb_curriculum",
                "grade_7",
                f"unit_{unit_no}"
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
