const fs = require("fs");
const path = require("path");

// Temizlemek istediğiniz dosyanın yolu (Örn: Çince cümleler)
const jsonFilePath =
  "D:\\000Memorade\\public\\data\\Chinesee\\content\\zh_ch_en\\sentences_ch_en.json";

function cleanUpAudioUrl() {
  try {
    const rawData = fs.readFileSync(jsonFilePath, "utf8");
    let jsonData = JSON.parse(rawData);

    // Diziyi tara ve gereksiz 'audioUrl' anahtarını sil
    const cleanedData = jsonData.map((item) => {
      if (item.audioUrl) {
        delete item.audioUrl;
      }
      return item;
    });

    fs.writeFileSync(
      jsonFilePath,
      JSON.stringify(cleanedData, null, 2),
      "utf8",
    );
    console.log("✅ Gereksiz 'audioUrl' satırları başarıyla temizlendi.");
  } catch (err) {
    console.error("❌ HATA:", err.message);
  }
}

cleanUpAudioUrl();
