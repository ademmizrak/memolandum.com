import json
import os
import time
from gtts import gTTS

RAW_DATA = [
  {"id": 1, "english": "Headmaster / Headmistress", "turkish": "Okul Müdürü", "example": "The headmaster gave an opening speech on the first day."},
  {"id": 2, "english": "Assistant Headmaster", "turkish": "Müdür Yardımcısı", "example": "You can ask the assistant headmaster for your timetable."},
  {"id": 3, "english": "Teacher", "turkish": "Öğretmen", "example": "Our English teacher explains the grammar rules very well."},
  {"id": 4, "english": "Student", "turkish": "Öğrenci", "example": "Every student should arrive at school on time."},
  {"id": 5, "english": "Caretaker", "turkish": "Okul Görevlisi / Hizmetli", "example": "The caretaker opened the main building doors early."},
  {"id": 6, "english": "Cleaner", "turkish": "Temizlik Görevlisi", "example": "The cleaner keeps our school corridors tidy."},
  {"id": 7, "english": "Librarian", "turkish": "Kütüphaneci", "example": "The librarian helped me find a great adventure book."},
  {"id": 8, "english": "School Nurse", "turkish": "Okul Hemşiresi", "example": "The school nurse gave me a bandage for my finger."},
  {"id": 9, "english": "Counsellor", "turkish": "Rehber Öğretmen / Psikolojik Danışman", "example": "The school counsellor helps us solve study problems."},
  {"id": 10, "english": "Secretary", "turkish": "Sekreter", "example": "The secretary printed the school letters for our parents."},
  {"id": 11, "english": "Coach", "turkish": "Antrenör / Koç", "example": "Our football coach trains the team every Tuesday."},
  {"id": 12, "english": "Classmate", "turkish": "Sınıf Arkadaşı", "example": "I study maths with my classmate after school."},
  {"id": 13, "english": "School Building", "turkish": "Okul Binası", "example": "Our school building has three large floors."},
  {"id": 14, "english": "Classroom", "turkish": "Sınıf / Derslik", "example": "We decorate our classroom with colourful science posters."},
  {"id": 15, "english": "Science Lab", "turkish": "Fen Laboratuvarı", "example": "We do exciting experiments in the science lab."},
  {"id": 16, "english": "Library", "turkish": "Kütüphane", "example": "The school library has hundreds of interesting storybooks."},
  {"id": 17, "english": "Canteen", "turkish": "Okul Kantini", "example": "Students buy healthy sandwiches at the canteen."},
  {"id": 18, "english": "Sports Field", "turkish": "Spor Sahası", "example": "We run and play games on the grass sports field."},
  {"id": 19, "english": "Sports Hall / Gym", "turkish": "Spor Salonu", "example": "We play basketball in the sports hall when it rains."},
  {"id": 20, "english": "Conference Hall", "turkish": "Konferans Salonu", "example": "The principal welcomed parents in the conference hall."},
  {"id": 21, "english": "Infirmary", "turkish": "Revir / Sağlık Odası", "example": "I rested in the infirmary because I felt dizzy."},
  {"id": 22, "english": "Administration Department", "turkish": "İdari Birim / Yönetim Bölümü", "example": "The administration department prepares student cards."},
  {"id": 23, "english": "Noticeboard", "turkish": "Duyuru Panosu", "example": "Look at the noticeboard for the club timetable."},
  {"id": 24, "english": "Schoolyard / Courtyard", "turkish": "Okul Bahçesi / Avlusu", "example": "Children play hide and seek in the schoolyard."},
  {"id": 25, "english": "Corridor", "turkish": "Koridor", "example": "Please walk quietly along the school corridor."},
  {"id": 26, "english": "Gate", "turkish": "Okul Giriş Kapısı", "example": "Security guards stand at the main school gate."},
  {"id": 27, "english": "Fountain", "turkish": "Okul Çeşmesi / Su Pınarı", "example": "I filled my water bottle at the courtyard fountain."},
  {"id": 28, "english": "School Rules", "turkish": "Okul Kuralları", "example": "Everyone should respect and follow school rules."},
  {"id": 29, "english": "Uniform", "turkish": "Okul Üniforması", "example": "Our school uniform is blue and white."},
  {"id": 30, "english": "Obey", "turkish": "Kurallara Uymak", "example": "Good students always obey their teachers' guidance."},
  {"id": 31, "english": "Punctual", "turkish": "Dakik Olmak / Zamanında Gelmek", "example": "It is important to be punctual for every lesson."},
  {"id": 32, "english": "Responsibilities", "turkish": "Sorumluluklar", "example": "Doing homework is one of our key responsibilities."},
  {"id": 33, "english": "Respect", "turkish": "Saygı Göstermek / Saygı", "example": "We show respect to our teachers and peers."},
  {"id": 34, "english": "Bully", "turkish": "Zorbalık Etmek", "example": "You should never bully anyone at school."},
  {"id": 35, "english": "Stand in line", "turkish": "Sıraya Girmek", "example": "Students stand in line before entering the classroom."},
  {"id": 36, "english": "Chew gum", "turkish": "Sakız Çiğnemek", "example": "You must not chew gum during the lesson."},
  {"id": 37, "english": "Shout", "turkish": "Bağırmak / Yüksek Sesle Konuşmak", "example": "Do not shout inside the quiet corridors."},
  {"id": 38, "english": "Fight", "turkish": "Kavga Etmek", "example": "Students must never fight in the school garden."},
  {"id": 39, "english": "Protect", "turkish": "Korumak / Muhafaza Etmek", "example": "We should protect our school property and desks."},
  {"id": 40, "english": "Raise a hand", "turkish": "El Kaldırmak", "example": "Raise a hand before answering the question."},
  {"id": 41, "english": "Throw rubbish", "turkish": "Çöp Atmak", "example": "Never throw rubbish on the floor."},
  {"id": 42, "english": "Rubbish bin", "turkish": "Çöp Kutusu", "example": "Put empty juice boxes into the rubbish bin."},
  {"id": 43, "english": "Follow instructions", "turkish": "Talimatlara Uymak", "example": "Listen carefully and follow instructions during experiments."},
  {"id": 44, "english": "Safe", "turkish": "Güvenli / Emniyetli", "example": "Our school environment is clean and safe."},
  {"id": 45, "english": "Law", "turkish": "Yasa / Kanun", "example": "Every country has laws to maintain peace."},
  {"id": 46, "english": "Permission", "turkish": "İzin", "example": "Ask for permission before leaving the room."},
  {"id": 47, "english": "Obligation", "turkish": "Zorunluluk / Yükümlülük", "example": "Wearing safety goggles in the lab is an obligation."},
  {"id": 48, "english": "School Club", "turkish": "Okul Kulübü", "example": "Joining a school club helps you meet new friends."},
  {"id": 49, "english": "Art Club", "turkish": "Sanat / Resim Kulübü", "example": "We paint watercolours in the art club every Friday."},
  {"id": 50, "english": "Science Club", "turkish": "Bilim / Fen Kulübü", "example": "The science club built a mini volcano model."},
  {"id": 51, "english": "Chess Club", "turkish": "Satranç Kulübü", "example": "I practice smart strategies in the chess club."},
  {"id": 52, "english": "Drama Club", "turkish": "Drama / Tiyatro Kulübü", "example": "The drama club is staging a classic play this term."},
  {"id": 53, "english": "Music Club", "turkish": "Müzik Kulübü", "example": "She plays the guitar nicely in the music club."},
  {"id": 54, "english": "Maths Club", "turkish": "Matematik Kulübü", "example": "The maths club solves brain-teaser puzzles."},
  {"id": 55, "english": "Sports Club", "turkish": "Spor Kulübü", "example": "The sports club organized a fun volleyball tournament."},
  {"id": 56, "english": "Technology Club", "turkish": "Teknoloji Kulübü", "example": "We learn basic coding in the technology club."},
  {"id": 57, "english": "Environment Club", "turkish": "Çevre Kulübü", "example": "The environment club planted trees around the schoolyard."},
  {"id": 58, "english": "Folk Dance Club", "turkish": "Halk Dansları Kulübü", "example": "The folk dance club prepared a colourful show."},
  {"id": 59, "english": "Literature Club", "turkish": "Edebiyat Kulübü", "example": "We read poetry in the weekly literature club."},
  {"id": 60, "english": "History Club", "turkish": "Tarih Kulübü", "example": "The history club visited an ancient museum yesterday."},
  {"id": 61, "english": "Debate Club", "turkish": "Münazara Kulübü", "example": "The debate club discusses interesting social topics."},
  {"id": 62, "english": "Extracurricular Activity", "turkish": "Ders Dışı Etkinlik", "example": "Playing chess is a fun extracurricular activity."},
  {"id": 63, "english": "Competition", "turkish": "Yarışma", "example": "Our school won first place in the quiz competition."},
  {"id": 64, "english": "Art Exhibition", "turkish": "Sanat Sergisi", "example": "Students displayed their paintings in the art exhibition."},
  {"id": 65, "english": "Project", "turkish": "Proje", "example": "Our science project explains the solar system."},
  {"id": 66, "english": "Group Work", "turkish": "Grup Çalışması", "example": "Group work helps us collaborate and share ideas."},
  {"id": 67, "english": "Primary School", "turkish": "İlkokul", "example": "Children study in primary school from grades 1 to 4."},
  {"id": 68, "english": "Lower Secondary School", "turkish": "Ortaokul", "example": "Students start lower secondary school in grade 5."},
  {"id": 69, "english": "Upper Secondary School", "turkish": "Lise", "example": "My older sister attends an upper secondary school."},
  {"id": 70, "english": "Vocational School", "turkish": "Meslek Okulu", "example": "Vocational schools train students in practical technical skills."},
  {"id": 71, "english": "International School", "turkish": "Uluslararası Okul", "example": "Children from many countries study at an international school."},
  {"id": 72, "english": "Boarding School", "turkish": "Yatılı Okul", "example": "Students live and study together in a boarding school."},
  {"id": 73, "english": "State School / Public School", "turkish": "Devlet Okulu", "example": "A state school provides free education to all students."},
  {"id": 74, "english": "Private School", "turkish": "Özel Okul", "example": "The private school offers modern computer laboratories."},
  {"id": 75, "english": "Graduate", "turkish": "Mezun Olmak", "example": "Students will graduate after completing all exams."},
  {"id": 76, "english": "Diploma", "turkish": "Diploma", "example": "He proudly received his graduation diploma."},
  {"id": 77, "english": "Qualification", "turkish": "Nitelik / Yeterlilik Belgesi", "example": "A language qualification opens doors around the world."},
  {"id": 78, "english": "Register", "turkish": "Kayıt Olmak", "example": "New students must register before the semester begins."},
  {"id": 79, "english": "Timetable", "turkish": "Ders Programı", "example": "Check the timetable to see which classes you have today."},
  {"id": 80, "english": "School Subject", "turkish": "Okul Dersi", "example": "My favourite school subject is science."},
  {"id": 81, "english": "Routine", "turkish": "Rutin / Günlük İşler", "example": "Waking up early is part of my morning routine."},
  {"id": 82, "english": "National Day", "turkish": "Milli Bayram / Milli Gün", "example": "We celebrate National Day with poetry and songs."},
  {"id": 83, "english": "Celebration", "turkish": "Kutlama", "example": "The school celebration was full of joyful performances."},
  {"id": 84, "english": "Celebrate", "turkish": "Kutlamak", "example": "We celebrate our victories together with classmates."},
  {"id": 85, "english": "Country", "turkish": "Ülke", "example": "Which country would you like to visit one day?"},
  {"id": 86, "english": "Flag", "turkish": "Bayrak", "example": "The national flag waves high in the courtyard."},
  {"id": 87, "english": "Festival", "turkish": "Festival / Şenlik", "example": "The spring festival brings students and teachers together."},
  {"id": 88, "english": "Arrange / Organise", "turkish": "Düzenlemek / Organize Etmek", "example": "Teachers will arrange a picnic next weekend."},
  {"id": 89, "english": "Solve", "turkish": "Çözmek (Problem/Soru)", "example": "Can you solve this tricky maths puzzle?"},
  {"id": 90, "english": "Species", "turkish": "Tür / Çeşit", "example": "Scientists discovered a rare bird species in the forest."},
  {"id": 91, "english": "Historical", "turkish": "Tarihi", "example": "Our city has many famous historical landmarks."},
  {"id": 92, "english": "Ancient", "turkish": "Antik / Çok Eski", "example": "We learned about ancient civilizations in history class."},
  {"id": 93, "english": "Türkiye", "turkish": "Türkiye", "example": "Türkiye is a beautiful bridge between Europe and Asia."},
  {"id": 94, "english": "Azerbaijan", "turkish": "Azerbaycan", "example": "Baku is the capital city of Azerbaijan."},
  {"id": 95, "english": "England / The UK", "turkish": "İngiltere / Birleşik Krallık", "example": "London is the capital of England and the UK."},
  {"id": 96, "english": "Germany", "turkish": "Almanya", "example": "Berlin is the bustling capital of Germany."},
  {"id": 97, "english": "France", "turkish": "Fransa", "example": "The Eiffel Tower is located in Paris, France."},
  {"id": 98, "english": "Italy", "turkish": "İtalya", "example": "Rome is famous for its rich history in Italy."},
  {"id": 99, "english": "Spain", "turkish": "İspanya", "example": "Madrid and Barcelona are prominent cities in Spain."},
  {"id": 100, "english": "Japan", "turkish": "Japonya", "example": "Tokyo is the vibrant capital city of Japan."}
]

DATA_DIR = "public/data/Tr_Eng_Ortaokul"
AUDIO_DIR = os.path.join(DATA_DIR, "Audio")
JSON_FILE = os.path.join(DATA_DIR, "Ortaokul_5_Sinif_Kelimeleri.json")

os.makedirs(AUDIO_DIR, exist_ok=True)

def clean_speech_text(text):
    # Turn slashes into natural comma pause for clear pronunciation
    t = text.replace(" / ", ", ").replace("/", ", ")
    return t.strip()

def build_dataset_and_audio():
    dataset = []
    print(f"Total words to process: {len(RAW_DATA)}")
    
    for idx, item in enumerate(RAW_DATA, start=1):
        word_id = f"w_{50000 + idx}"
        english = item["english"]
        turkish = item["turkish"]
        example = item["example"]
        
        mp3_name = f"{word_id}.mp3"
        mp3_path = os.path.join(AUDIO_DIR, mp3_name)
        audio_url = f"/data/Tr_Eng_Ortaokul/Audio/{mp3_name}"
        
        # Audio generation with gTTS
        speech_text = clean_speech_text(english)
        need_tts = not os.path.exists(mp3_path) or os.path.getsize(mp3_path) < 1000
        
        if need_tts:
            retries = 3
            success = False
            for attempt in range(retries):
                try:
                    tts = gTTS(text=speech_text, lang='en', tld='com')
                    tts.save(mp3_path)
                    print(f"[{idx}/100] Generated TTS: {word_id} -> '{speech_text}' ({os.path.getsize(mp3_path)} bytes)")
                    success = True
                    time.sleep(0.3)
                    break
                except Exception as e:
                    print(f"[{idx}/100] Attempt {attempt+1} failed for {word_id}: {e}")
                    time.sleep(1.0)
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
            "cefr_level": "A1",
            "curriculum": {
                "system": "MEB",
                "grades": [5],
                "units": [
                    {
                        "grade": 5,
                        "unit_no": 1,
                        "unit_name": "School Life"
                    }
                ]
            },
            "tags": [
                "school_life",
                "meb_curriculum",
                "grade_5",
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
