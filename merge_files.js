const fs = require("fs");
const path = require("path");

// Scriptin bulunduğu klasörü baz al
const directoryPath = __dirname;
const outputPath = path.join(directoryPath, "merged_synonym_antonyms.json");

function mergeFiles() {
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Klasör okunamadı:", err);
      return;
    }

    // Sadece 'en_tr_eşanlamlı_' ile başlayan JSON dosyalarını al
    const jsonFiles = files.filter(
      (f) =>
        f.startsWith("en_tr_eşanlamlı_") &&
        f.endsWith(".json") &&
        f !== "merged_synonym_antonyms.json",
    );

    let mergedData = [];

    jsonFiles.forEach((file) => {
      try {
        const filePath = path.join(directoryPath, file);
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        mergedData = mergedData.concat(data);
        console.log(`✅ ${file} birleştirildi.`);
      } catch (e) {
        console.error(`❌ ${file} hatalı:`, e.message);
      }
    });

    if (mergedData.length > 0) {
      fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), "utf8");
      console.log(
        `\n🎉 İşlem tamamlandı! Toplam ${mergedData.length} kelime birleştirildi: ${outputPath}`,
      );
    } else {
      console.log("\n⚠️ Birleştirilecek veri bulunamadı.");
    }
  });
}

mergeFiles();
