import os

# Klasör yolu
folder_path = r"D:\000Memorade\tts-generator\audio_sentences_es"
prefix = "es_"

def add_it_prefix():
    # Klasörün varlığını kontrol et
    if not os.path.exists(folder_path):
        print(f"Hata: {folder_path} yolu bulunamadı.")
        return

    # Klasördeki .mp3 uzantılı dosyaları listele
    files = [f for f in os.listdir(folder_path) if f.endswith(".mp3")]

    count = 0
    for filename in files:
        # Dosya zaten 'it_' ile başlıyorsa tekrar eklememek için kontrol
        if not filename.startswith(prefix):
            new_filename = f"{prefix}{filename}"
            
            old_file = os.path.join(folder_path, filename)
            new_file = os.path.join(folder_path, new_filename)
            
            # Yeniden adlandır
            os.rename(old_file, new_file)
            print(f"Güncellendi: {filename} -> {new_filename}")
            count += 1
        else:
            print(f"Atlandı (zaten 'it_' içeriyor): {filename}")

    print(f"\nİşlem tamamlandı. Toplam {count} dosya güncellendi.")

if __name__ == "__main__":
    add_it_prefix()