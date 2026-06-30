const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "google-key.json"),
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// JSON dosyanızın yolunu buraya ekleyin
const dataFilePath = path.join(__dirname, "YKS-DIL_Group11_en-tr_v2.json");
let wordList = [];

try {
  let rawData = fs.readFileSync(dataFilePath, "utf8");
  wordList = JSON.parse(rawData);
} catch (error) {
  console.error("❌ JSON dosyası okunamadı.", error.message);
  process.exit(1);
}

const outputDir = path.join(__dirname, "audio_yks");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function createYKSAudio() {
  console.log(`🚀 ${wordList.length} YKS kelimesi işleniyor...`);

  for (const item of wordList) {
    const textToRead = item.word;

    // Dosya adı tam olarak kelimenin kendisi olsun (örneğin: "abandon.mp3")
    // Eğer kelime içerisinde geçersiz karakterler varsa işletim sistemi sorun yaratabilir,
    // bu yüzden sadece temel isimlendirme kullanıyoruz.
    const fileName = `${textToRead}.mp3`;
    const filePath = path.join(outputDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log(`⏩ Atlandı (Zaten var): ${fileName}`);
      continue;
    }

    const request = {
      input: { text: textToRead },
      voice: {
        languageCode: "en-US",
        name: "en-US-Journey-F",
        ssmlGender: "FEMALE",
      },
      audioConfig: { audioEncoding: "MP3" },
    };

    try {
      const [response] = await client.synthesizeSpeech(request);
      fs.writeFileSync(filePath, response.audioContent, "binary");
      console.log(`✅ ${fileName} oluşturuldu.`);

      await delay(1000);
    } catch (error) {
      console.error(`❌ Hata (${textToRead}):`, error.message);
      await delay(5000);
    }
  }
  console.log("🎉 Tüm YKS ses dosyaları başarıyla işlendi!");
}

createYKSAudio();
