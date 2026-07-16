const fs = require("fs");
const path = require("path");
const textToSpeech = require("@google-cloud/text-to-speech");

const client = new textToSpeech.TextToSpeechClient({
  keyFilename: path.join(__dirname, "google-key.json"),
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// İşlenecek dosyalar
const inputFiles = [
  "a1_zh_CN_En_201_300.json",
  "a1_zh_CN_En_301_400.json",
  "a2_zh_CN_En_001_100.json",
  "a2_zh_CN_En_101_200.json",
  "b1_zh_CN_En_001_100.json",
  "b1_zh_CN_En_101_200.json",
  "b2_zh_CN_En_001_100.json",
  "b2_zh_CN_En_101_200.json",
  "c1_zh_CN_En_001_100.json",
  "c1_zh_CN_En_101_200.json",
  "c2_zh_CN_En_001_100.json",
  "c2_zh_CN_En_101_200.json",
];

const outputDir = path.join(__dirname, "audio_zh_words_native");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

async function main() {
  for (const file of inputFiles) {
    const filePath = path.join(__dirname, file);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Dosya bulunamadı: ${file}`);
      continue;
    }

    // JSON verisini oku
    const rawData = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(rawData);

    // JSON yapısındaki 'words' dizisine erişim sağlanıyor
    console.log(`📂 İşleniyor: ${file}`);

    for (const item of data.words) {
      // Çıkış dosyası ismi word_id kullanılarak oluşturuluyor
      const outputFile = path.join(outputDir, `${item.word_id}.mp3`);

      // Eğer dosya zaten varsa tekrar üretme
      if (fs.existsSync(outputFile)) continue;

      // Seslendirme isteği: 'item.hanzi' metni kullanılıyor
      const request = {
        input: { text: item.hanzi },
        voice: {
          languageCode: "cmn-CN",
          name: "cmn-CN-Wavenet-D",
          ssmlGender: "MALE",
        },
        audioConfig: { audioEncoding: "MP3", speakingRate: 0.9 },
      };

      try {
        const [response] = await client.synthesizeSpeech(request);
        fs.writeFileSync(outputFile, response.audioContent, "binary");
        console.log(`✅ Üretildi: ${item.word_id} (${item.hanzi})`);
        await delay(300); // API limitlerine takılmamak için bekleme
      } catch (err) {
        console.error(`❌ Hata (${item.word_id}): ${err.message}`);
      }
    }
  }
}

main().catch(console.error);
