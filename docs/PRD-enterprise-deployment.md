# PRD: Enterprise Deployment ve İçerik Ayrıştırma Mimarisi

Uygulama durumu: **Faz 1–4 iskeleti landed** (`docs/DEPLOYMENT.md`).

## Amaç

Deployment sürelerini düşürmek; içerik güncellemelerini uygulama kodundan ayırmak.

## Mimari

```
Code  → deploy:app     → Firebase Hosting (App Shell)
Content → deploy:content → GCS / CDN (checksum delta)
Client loader → GCS-primary (localhost: local-first)
```

## Kabul kriterleri eşlemesi

| Kriter | Nasıl |
|--------|--------|
| Kod deploy &lt; ~2 dk hedefi | Slim `out/` + Hosting ignore `data/**` |
| İçerik Hosting’siz | `npm run deploy:content` |
| Artifact temizliği | Slim hide + out strip + firebase ignore |
| 404’süz loader | GCS-primary + local fallback |

## Kapsam dışı

Firestore / business logic değişiklikleri bu PRD’de yok.
