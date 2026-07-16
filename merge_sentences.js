const fs = require("fs");
const path = require("path");

// Klasör yolu Türkçe cümleler için güncellendi
const directoryPath =
  "D:\\000Memorade\\public\\data\\Turkish\\content\\en_tr\\sentences";
const outputPath = path.join(directoryPath, "merged_sentences_en_tr.json");

function mergeTurkishSentenceFiles() {
  let mergedData = [];

  if (!fs.existsSync(directoryPath)) {
    console.error("HATA: Klasör bulunamadı: " + directoryPath);
    return;
  }

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Klasör okunurken hata oluştu: " + err);
      return;
    }

    // Birleştirme işlemini yapacak dosyaları filtrele
    const jsonFiles = files.filter(
      (file) =>
        path.extname(file) === ".json" &&
        file !== "merged_sentences_en_tr.json",
    );

    console.log(
      `${jsonFiles.length} adet Türkçe cümle dosyası birleştiriliyor...`,
    );

    jsonFiles.forEach((file) => {
      const filePath = path.join(directoryPath, file);
      try {
        const fileContent = fs.readFileSync(filePath, "utf8");
        const jsonData = JSON.parse(fileContent);

        // Veri dizi ise ekle, değilse nesne olarak ekle
        if (Array.isArray(jsonData)) {
          mergedData = mergedData.concat(jsonData);
        } else {
          mergedData.push(jsonData);
        }
        console.log(`✅ ${file} işlendi.`);
      } catch (parseErr) {
        console.error(`❌ ${file} işlenemedi: ${parseErr.message}`);
      }
    });

    // Sonucu kaydet
    try {
      fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), "utf8");
      console.log(
        `\n🎉 İşlem tamamlandı! Toplam ${mergedData.length} cümle "${outputPath}" dosyasına yazıldı.`,
      );
    } catch (writeErr) {
      console.error("Dosya yazılırken hata oluştu: " + writeErr.message);
    }
  });
}

mergeTurkishSentenceFiles();
