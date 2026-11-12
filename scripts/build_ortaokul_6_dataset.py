import json
import os
import time
from gtts import gTTS

RAW_DATA = [
  {"id": 1, "english": "Assembly", "turkish": "Okul toplanması / İçtima", "example": "All students gather in the schoolyard for the morning assembly."},
  {"id": 2, "english": "School ceremony", "turkish": "Okul töreni", "example": "We wore our neat uniforms for the opening school ceremony."},
  {"id": 3, "english": "National anthem", "turkish": "Milli marş / İstiklal Marşı", "example": "Everyone stood up proudly to sing the national anthem."},
  {"id": 4, "english": "Headmaster", "turkish": "Okul müdürü", "example": "The headmaster welcomed the new sixth graders warmly."},
  {"id": 5, "english": "Headmaster's room", "turkish": "Müdür odası", "example": "The headmaster's room is on the second floor near the office."},
  {"id": 6, "english": "Teacher's room", "turkish": "Öğretmenler odası", "example": "Teachers prepare their lesson materials in the teacher's room."},
  {"id": 7, "english": "Conference hall", "turkish": "Konferans salonu", "example": "The guest author gave a presentation in the conference hall."},
  {"id": 8, "english": "School garden", "turkish": "Okul bahçesi", "example": "We planted colourful flowers in the school garden."},
  {"id": 9, "english": "Sports field", "turkish": "Spor sahası", "example": "Students play football on the sports field after classes."},
  {"id": 10, "english": "Science lab", "turkish": "Fen laboratuvarı", "example": "We observed plant cells under a microscope in the science lab."},
  {"id": 11, "english": "Library", "turkish": "Kütüphane", "example": "I borrow adventure and fantasy books from the school library."},
  {"id": 12, "english": "Canteen / Lunch hall", "turkish": "Kantin / Yemekhane", "example": "We eat a healthy lunch together in the canteen."},
  {"id": 13, "english": "Classroom", "turkish": "Sınıf", "example": "Our classroom has bright windows and a modern smartboard."},
  {"id": 14, "english": "Playground", "turkish": "Oyun alanı / Okul bahçesi", "example": "Children laugh and play tag in the school playground."},
  {"id": 15, "english": "Secretary", "turkish": "Sekreter", "example": "The secretary helped my father register my school documents."},
  {"id": 16, "english": "Parent", "turkish": "Veli / Anne-Baba", "example": "My parents attended the teacher meeting on Friday afternoon."},
  {"id": 17, "english": "Teacher", "turkish": "Öğretmen", "example": "Our science teacher always explains difficult topics clearly."},
  {"id": 18, "english": "Student", "turkish": "Öğrenci", "example": "Every student should bring their notebook and pencil case."},
  {"id": 19, "english": "Role", "turkish": "Rol / Görev", "example": "Each member has an important role in our science project."},
  {"id": 20, "english": "Responsibility", "turkish": "Sorumluluk", "example": "Keeping the classroom clean is our shared responsibility."},
  {"id": 21, "english": "Carry the flag", "turkish": "Bayrak taşımak", "example": "Two top students were chosen to carry the flag in the ceremony."},
  {"id": 22, "english": "Read a poem", "turkish": "Şiir okumak", "example": "Selin will read a poem on Republic Day."},
  {"id": 23, "english": "Decorate the classroom", "turkish": "Sınıfı süslemek", "example": "We decorated the classroom with paper flags and balloons."},
  {"id": 24, "english": "Choir", "turkish": "Koro", "example": "Our school choir sings beautiful traditional melodies."},
  {"id": 25, "english": "Sing in the choir", "turkish": "Koroda şarkı söylemek", "example": "Ali practices twice a week to sing in the choir."},
  {"id": 26, "english": "Guide the programme", "turkish": "Programı sunmak / Yönetmek", "example": "Two student leaders guided the festival programme smoothly."},
  {"id": 27, "english": "Leader", "turkish": "Lider / Kol başkanı", "example": "A good group leader listens to everyone's opinions."},
  {"id": 28, "english": "Team player", "turkish": "Takım oyuncusu / Uyumlu çalışan", "example": "He passes the ball often because he is a great team player."},
  {"id": 29, "english": "In the spotlight", "turkish": "İlgi odağında / Sahnede", "example": "The young actor was in the spotlight on the theatre stage."},
  {"id": 30, "english": "Make the grade", "turkish": "Başarılı olmak / Geçer not almak", "example": "With regular study, everyone can easily make the grade."},
  {"id": 31, "english": "Follow the rules", "turkish": "Kurallara uymak", "example": "Students must follow the rules to stay safe in the lab."},
  {"id": 32, "english": "Greet", "turkish": "Selamlamak", "example": "We always smile and greet our teachers in the corridor."},
  {"id": 33, "english": "Celebration", "turkish": "Kutlama", "example": "The school anniversary celebration was lively and colorful."},
  {"id": 34, "english": "Celebrate", "turkish": "Kutlamak", "example": "We celebrate national holidays with music and poetry."},
  {"id": 35, "english": "Parade", "turkish": "Geçit töreni", "example": "The marching band played drums during the town parade."},
  {"id": 36, "english": "Flag", "turkish": "Bayrak", "example": "Our red flag waves gently in the morning breeze."},
  {"id": 37, "english": "Give a speech", "turkish": "Konuşma yapmak", "example": "The class president gave a speech about kindness."},
  {"id": 38, "english": "Pack the backpack", "turkish": "Çantayı hazırlamak / Toplamak", "example": "I always pack my backpack before going to bed."},
  {"id": 39, "english": "Interview", "turkish": "Mülakat / Röportaj", "example": "We conducted an interview with our school principal for the magazine."},
  {"id": 40, "english": "Volunteer", "turkish": "Gönüllü olmak", "example": "Many students volunteered to help at the charity book fair."},
  {"id": 41, "english": "Support", "turkish": "Desteklemek / Arka çıkmak", "example": "Good friends always support each other during exams."},
  {"id": 42, "english": "Join a club", "turkish": "Kulübe katılmak", "example": "I want to join a club to learn how to play guitar."},
  {"id": 43, "english": "Talent show", "turkish": "Yetenek yarışması", "example": "Can played the violin beautifully in the talent show."},
  {"id": 44, "english": "Art club", "turkish": "Sanat / Resim kulübü", "example": "We painted lovely landscape pictures in the art club."},
  {"id": 45, "english": "Music club", "turkish": "Müzik kulübü", "example": "The music club meets every Wednesday to play instruments."},
  {"id": 46, "english": "Science club", "turkish": "Fen / Bilim kulübü", "example": "The science club designed a solar-powered toy car."},
  {"id": 47, "english": "Always", "turkish": "Her zaman / Daima", "example": "I always brush my teeth and pack my bag before school."},
  {"id": 48, "english": "Usually", "turkish": "Genellikle", "example": "We usually eat lunch together at twelve thirty."},
  {"id": 49, "english": "Often", "turkish": "Sık sık", "example": "Sixth graders often visit the library during break times."},
  {"id": 50, "english": "Sometimes", "turkish": "Bazen / Ara sıra", "example": "I sometimes ride my bicycle to school in sunny weather."},
  {"id": 51, "english": "Rarely / Seldom", "turkish": "Nadiren", "example": "It rarely snows here during early autumn."},
  {"id": 52, "english": "Never", "turkish": "Hiçbir zaman / Asla", "example": "You should never cross the street without looking both ways."},
  {"id": 53, "english": "Wake up", "turkish": "Uyanmak", "example": "I wake up at seven o'clock every weekday morning."},
  {"id": 54, "english": "Walk to school", "turkish": "Okula yürüyerek gitmek", "example": "My best friend and I walk to school together."},
  {"id": 55, "english": "Take the bus", "turkish": "Otobüse binmek", "example": "Many pupils take the bus when the weather is rainy."},
  {"id": 56, "english": "Listen attentively", "turkish": "Dikkatlice dinlemek", "example": "Students listen attentively to the teacher's instructions."},
  {"id": 57, "english": "Do homework", "turkish": "Ödev yapmak", "example": "I do homework right after having an afternoon snack."},
  {"id": 58, "english": "Leave", "turkish": "Ayrılmak / Bırakmak", "example": "School classes leave the campus at half past three."},
  {"id": 59, "english": "Lend", "turkish": "Ödünç vermek", "example": "Can you lend me an eraser for a moment?"},
  {"id": 60, "english": "Organise", "turkish": "Düzenlemek / Organize etmek", "example": "Our class will organise a chess tournament next month."},
  {"id": 61, "english": "Pass an exam", "turkish": "Sınavı geçmek", "example": "If you revise your notes, you will easily pass the exam."},
  {"id": 62, "english": "Fail an exam", "turkish": "Sınavdan kalmak / Başarısız olmak", "example": "He studied hard so that he would not fail the exam."},
  {"id": 63, "english": "Try / Do one's best", "turkish": "Çabalamak / Elinden gelenin en iyisini yapmak", "example": "Always try your best even when problems seem tough."},
  {"id": 64, "english": "Practise", "turkish": "Pratik yapmak / Antrenman etmek", "example": "You should practise speaking English with your classmates."},
  {"id": 65, "english": "Solve a problem", "turkish": "Problem / Sorun çözmek", "example": "We collaborated to solve the challenging maths problem."},
  {"id": 66, "english": "Shout", "turkish": "Bağırmak", "example": "Please speak softly and do not shout in the library."},
  {"id": 67, "english": "Smile", "turkish": "Gülümsemek", "example": "A friendly smile makes everyone feel welcome."},
  {"id": 68, "english": "Carefully", "turkish": "Dikkatlice", "example": "Hold the glass test tubes carefully in the laboratory."},
  {"id": 69, "english": "Cheerfully", "turkish": "Neşeyle / Coşkuyla", "example": "The children sang cheerfully as they entered the bus."},
  {"id": 70, "english": "Creative", "turkish": "Yaratıcı", "example": "She designed a very creative poster for the science fair."},
  {"id": 71, "english": "Effective", "turkish": "Etkili", "example": "Flashcards are an effective way to memorize new vocabulary."},
  {"id": 72, "english": "Goal", "turkish": "Hedef / Amaç", "example": "My main goal this term is to improve my English vocabulary."},
  {"id": 73, "english": "Habit", "turkish": "Alışkanlık", "example": "Reading twenty minutes every evening is a fantastic habit."},
  {"id": 74, "english": "Instruction", "turkish": "Talimat / Yönerge", "example": "Follow each instruction written on the exam paper."},
  {"id": 75, "english": "Keen", "turkish": "Hevesli / İstekli", "example": "Emre is very keen on learning robotic coding."},
  {"id": 76, "english": "Learning", "turkish": "Öğrenme / Öğrenim", "example": "Active games make language learning exciting and memorable."},
  {"id": 77, "english": "Level", "turkish": "Seviye", "example": "She reached an intermediate level in spoken English."},
  {"id": 78, "english": "Care", "turkish": "Önemsemek / Özen göstermek", "example": "We care deeply about keeping our school environment clean."},
  {"id": 79, "english": "Continue", "turkish": "Devam etmek", "example": "Please continue reading from page forty-two."},
  {"id": 80, "english": "Count", "turkish": "Saymak", "example": "Little kids learn to count from one to one hundred."},
  {"id": 81, "english": "Focus on", "turkish": "Odaklanmak", "example": "Turn off the TV so you can focus on your homework."},
  {"id": 82, "english": "Follow-up", "turkish": "Takip / Devam etkinliği", "example": "The teacher assigned a follow-up activity for the next lesson."},
  {"id": 83, "english": "Introduce", "turkish": "Tanıtmak / Tanıştırmak", "example": "Let me introduce my new classmate, Zeynep."},
  {"id": 84, "english": "Be proud of", "turkish": "Gurur duymak", "example": "Our parents are very proud of our high exam marks."},
  {"id": 85, "english": "Line up", "turkish": "Sıraya girmek", "example": "Please line up single file before entering the sports hall."},
  {"id": 86, "english": "Line up quietly", "turkish": "Sessizce sıraya girmek", "example": "The class lined up quietly outside the computer room."},
  {"id": 87, "english": "Clean up", "turkish": "Temizlemek / Toplamak", "example": "Students clean up their desks before leaving the art room."},
  {"id": 88, "english": "Timetable / Schedule", "turkish": "Ders programı / Zaman çizelgesi", "example": "Check your timetable to see what books to bring tomorrow."},
  {"id": 89, "english": "Daily routine", "turkish": "Günlük rutin", "example": "Brushing teeth and packing bags are parts of my daily routine."},
  {"id": 90, "english": "School routine", "turkish": "Okul rutini", "example": "Morning assembly is an essential part of our school routine."},
  {"id": 91, "english": "National day", "turkish": "Milli bayram", "example": "Students perform folk dances on each national day."},
  {"id": 92, "english": "Republic Day", "turkish": "Cumhuriyet Bayramı (29 Ekim)", "example": "We celebrate Republic Day on the twenty-ninth of October."},
  {"id": 93, "english": "Democracy Day", "turkish": "Demokrasi ve Milli Birlik Günü (15 Temmuz)", "example": "Schools commemorate Democracy Day with special exhibits."},
  {"id": 94, "english": "Children's Day", "turkish": "Ulusal Egemenlik ve Çocuk Bayramı (23 Nisan)", "example": "The twenty-third of April is celebrated as Children's Day."},
  {"id": 95, "english": "Respect", "turkish": "Saygı / Saygı göstermek", "example": "We treat everyone with kindness and mutual respect."},
  {"id": 96, "english": "Cooperation", "turkish": "İş birliği / Dayanışma", "example": "Good teamwork requires cooperation and honest communication."},
  {"id": 97, "english": "Participation", "turkish": "Katılım", "example": "Active participation in class discussions boosts your confidence."},
  {"id": 98, "english": "Performance", "turkish": "Performans / Gösteri", "example": "The drama group gave an outstanding stage performance."},
  {"id": 99, "english": "Attendance", "turkish": "Devam / Katılım durumu", "example": "Regular attendance is crucial for academic achievement."},
  {"id": 100, "english": "Give feedback", "turkish": "Geri bildirim vermek", "example": "Teachers give helpful feedback on our essays and quizzes."}
]

DATA_DIR = "public/data/Tr_Eng_Ortaokul"
AUDIO_DIR = os.path.join(DATA_DIR, "Audio")
JSON_FILE = os.path.join(DATA_DIR, "Ortaokul_6_Sinif_Kelimeleri.json")

os.makedirs(AUDIO_DIR, exist_ok=True)

def clean_speech_text(text):
    # Turn slashes into natural comma pause for clear pronunciation
    t = text.replace(" / ", ", ").replace("/", ", ")
    return t.strip()

def build_dataset_and_audio():
    dataset = []
    print(f"Total words to process: {len(RAW_DATA)}")
    
    for idx, item in enumerate(RAW_DATA, start=1):
        word_id = f"w_{60000 + idx}"
        english = item["english"]
        turkish = item["turkish"]
        example = item["example"]
        
        mp3_name = f"{word_id}.mp3"
        mp3_path = os.path.join(AUDIO_DIR, mp3_name)
        audio_url = f"/data/Tr_Eng_Ortaokul/Audio/{mp3_name}"
        
        # Audio generation with edge-tts
        speech_text = clean_speech_text(english)
        need_tts = not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 1000
        
        if need_tts:
            retries = 3
            success = False
            for attempt in range(retries):
                try:
                    import asyncio
                    import edge_tts
                    asyncio.run(edge_tts.Communicate(speech_text, "en-US-JennyNeural").save(mp3_path))
                    print(f"[{idx}/100] Generated Edge-TTS: {word_id} -> '{speech_text}' ({os.path.getsize(mp3_path)} bytes)")
                    success = True
                    break
                except Exception as e:
                    print(f"[{idx}/100] Attempt {attempt+1} failed for {word_id}: {e}")
                    time.sleep(0.5)
            if not success:
                print(f"[ERROR] Failed to generate TTS for {word_id}")
        else:
            print(f"[{idx}/100] Audio already exists: {word_id} ({os.path.getsize(mp3_path)} bytes)")

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
                "grades": [6],
                "units": [
                    {
                        "grade": 6,
                        "unit_no": 1,
                        "unit_name": "School Life"
                    }
                ]
            },
            "tags": [
                "school_life",
                "meb_curriculum",
                "grade_6",
                "unit_1"
            ],
            "example_sentence": example,
            "audioUrl": audio_url
        }
        dataset.append(entry)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    print(f"\nSuccessfully generated {len(dataset)} items in {JSON_FILE}!")

if __name__ == "__main__":
    build_dataset_and_audio()
