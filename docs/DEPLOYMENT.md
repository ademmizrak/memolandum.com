# Enterprise Deployment — App Shell vs Content

Bu belge [PRD: Enterprise Deployment ve İçerik Ayrıştırma](./PRD-enterprise-deployment.md) uygulamasını özetler.

## Dual pipeline

| Komut | Ne yapar | Hedef |
|--------|-----------|--------|
| `npm run deploy:content` | MD5 checksum delta sync | GCS bucket (`data/`, `assets/words/`, `assets/audio/`) |
| `npm run deploy:content:dry` | Upload etmeden delta sayımı | — |
| `npm run deploy:app` | Slim Next build + Hosting | Firebase Hosting (App Shell) |
| `npm run deploy:app:build` | Sadece slim `out/` üretir | lokal |

## App Shell kuralları (`deploy:app`)

Build sırasında geçici gizlenir:

- `public/data`
- `public/assets/audio`
- `public/assets/words`

`MEMOLANDUM_SLIM_APP=1` → sözlük kavram SSG üretilmez; Firebase rewrite `/sozluk/*/*` → `/sozluk/_concept/`.

`out/` içinden `data/`, ağır medya ve kavram HTML’leri temizlenir. Hedef: **yüzlerce–birkaç bin** dosya, 50k+ değil.

## Content kuralları (`deploy:content`)

- Yalnızca hash’i değişen / yeni dosyalar yüklenir
- JSON: `Cache-Control: max-age=60`
- Medya: uzun cache + immutable
- `academic/glossary-index.json` otomatik üretilir (SPA sözlük)

## Loader (GCS-primary)

`src/lib/contentCdn.js`:

- **Production:** GCS önce, Hosting `/data` yedek
- **localhost:** `/data` önce (DX), aksi halde GCS

Env (opsiyonel):

```bash
NEXT_PUBLIC_DATA_BASE_URL=https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data
NEXT_PUBLIC_ASSETS_BASE_URL=https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app
```

## GitHub Actions

- `.github/workflows/deploy-app.yml` — kod değişince slim Hosting
- `.github/workflows/deploy-content.yml` — `public/data|assets/words|assets/audio` değişince GCS
- Eski merge/PR hosting workflow’ları slim build kullanacak şekilde güncellendi

## Yerel kullanım

```bash
# Sadece 3 İlkokul JSON’u
npm run deploy:content -- --only=Tr_Eng_Ilkokul

# UI değişti
npm run deploy:app
```

**Not:** İlk `deploy:content` büyük delta olabilir (bucket’ta eksik asset’ler). Sonraki koşular saniyeler–dakikalar sürmelidir.
