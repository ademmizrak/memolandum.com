# PRD: Memolandum AI Adaptive Learning Loop

| Alan | Değer |
|------|--------|
| **Ürün** | Memolandum |
| **Doküman** | AI Adaptive Learning — Ürün Gereksinimleri |
| **Sürüm** | 1.1 |
| **Tarih** | 2026-07-15 |
| **Durum** | Draft — onay bekliyor |
| **İlgili vizyon** | Oyun = antrenman · Quiz = ölçüm · Bucket = kanonik havuz · Kullanıcı kelimesi = kişisel lexikon · AI = level + zenginleştirme |

---

## 1. Özet

Memolandum’u sabit seviye listelerinden çıkarıp, **iki katmanlı kelime ekonomisi + adaptive AI** ile kullanıcının kendi öğrenme dünyasını kurduğu ve ona bağlandığı bir beceri platformu haline getirmek.

### 1.1 Ürün üçlüsü

- **Oyunlar:** Kelimeyi bağlamda / hızda / streste çalıştıran antrenman sahası.  
- **Quiz’ler (oyun mantıklı, nokta atışlı):** Kullanıcının neyi bildiğini / bilmediğini ölçen, AI’ye temiz sinyal üreten araç.  
- **AI:** Quiz + oyun olaylarından öğrenme profili çıkarır; bir sonraki oyun level’ini yapılandırır; **bizde olmayan kullanıcı kelimelerini** normalleştirip sisteme kazandırır.

### 1.2 Çift lexikon (v1.1 çekirdek)

| Katman | Kaynak | Rol |
|--------|--------|-----|
| **Canonical Lexicon (CL)** | Mevcut GCS / Firebase Storage bucket kelime veritabanları (CEFR, kategori, dil çiftleri, audio) | Kaliteli, kuratörlü, ölçekli aday havuz |
| **Personal Lexicon (PL)** | Anlık çeviri, kullanıcı girişi, quiz’te görülen “bilinmeyen”, kasaya eklenen | Kullanıcıya özel dünya — bağımlılık / alışkanlık motoru |

**Kuzey yıldızı:** Kullanıcı Memolandum’a her geldiğinde *kendi kelimeleri + zayıf noktaları + bucket’tan akıllı takviye* ile kişiselleştirilmiş bir antrenman bulur. Platform “içerik kataloğu” değil, **kişisel kelime grafiği** olur.

Bu döngü tamamlandığında ürün, “AI çeviri özelliği olan oyun”dan çıkıp **core technology’nin AI + kişisel lexikon olduğu bir öğrenme ürünü** konumuna yaklaşır.

---

## 2. Problem

| Bugün | İstenen |
|-------|---------|
| Seviyeler çoğunlukla statik bucket JSON | Level = kişisel PL + CL’den akıllı karışım |
| Bucket zengin; kullanıcı kelimesi yan kanal (vault/çeviri) | **Bizde olmayan kelime** sisteme girer, zenginleşir, oyuna akar |
| Öğrenme sinyali dağınık (skor, kasa, strength) | Tek **Learning Event** + lexikon grafiği |
| AI yalnızca anlık çeviride | AI: seviye planlama + kelime normalleştirme/zenginleştirme |
| Kullanıcı aynı A1 listesini rastgele görür | “Benim kelimelerim” + zayıf nokta — bırakması zor alışkanlık |

Kullanıcı eğlense de platform *onun dünyası* değil; bucket kataloğu. Bağımlılık, **kişisel lexikonun büyümesi ve pekişmesi** ile gelir.

---

## 3. Hedefler

### 3.1 Ürün hedefleri

1. **Canonical Lexicon (bucket)** aday havuzun tek kaynağı olarak kalsın (kalite, audio, CEFR).  
2. Kullanıcıdan gelen / sistemde olmayan kelimeleri **Personal Lexicon**’a güvenli şekilde aktar.  
3. Her oturumda deck = `PL öncelikli + CL takviye` (oranlar ayarlanır).  
4. Quiz + oyun sinyaliyle mastery güncelle; AI bir sonraki antrenmanı kursun.  
5. Anlık çeviri / kasa / quiz “bilmiyorum” → PL intake pipeline.  
6. Habit loop: streak, “kasandaki N kelime”, “bugün 5 zayıf kapanır” — kişisel ilerleme hissi.

### 3.2 Başarı metrikleri (MVP sonrası 4–6 hafta)

| Metrik | Hedef (yön) |
|--------|-------------|
| Adaptive level ile başlayan seans oranı | ↑ (%30+ girişli) |
| Deck içinde PL kelime oranı (ort.) | %20–50 (kullanıcı PL’si yeterince dolunca) |
| Yeni PL intake / aktif kullanıcı / hafta | ↑ |
| Bucket’a (CL) önerilen / onaylanan yeni lemma (ops. faz 2) | izlenir |
| Zayıf kelime setinde tekrar oranı | ↑ |
| Quiz → oyun geçiş oranı | ≥ %60 |
| D7 retention (girişli, PL ≥ 10 kelime) | ↑↑ (PL’siz segmente göre) |
| AI level + enrich latency (p95) | ≤ 3 sn (cache’li ≤ 500 ms) |

### 3.3 Olmayan hedefler (Out of scope — v1)

- Canlı konuşma koçu / realtime dialog AI  
- Her oyun frame’inde model çağrısı  
- Kullanıcı kelimesinin **otomatik** global bucket’a (CL) yazılması (kürasyon gerekir)  
- Web3 / blockchain  
- Mevcut 6 oyunun mekaniğini baştan yazmak  

---

## 3A. Çift lexikon & kişisel bağımlılık modeli (v1.1)

### 3A.1 İlke

```
         ┌──────────────────────────┐
         │  Canonical Lexicon (CL)  │  ← GCS bucket JSON’lar
         │  kuratörlü, audio’lu     │
         └────────────┬─────────────┘
                      │ aday / takviye
                      ▼
              ┌───────────────┐
   intake →   │ Adaptive Deck │  ← AI + kurallar
   (çeviri,   └───────┬───────┘
    yazma,            │
    bilmiyorum)       ▼
         ┌──────────────────────────┐
         │  Personal Lexicon (PL)   │  ← kullanıcıya özel
         │  vault + AI zenginleşmiş │
         └──────────────────────────┘
                      │
                      ▼ mastery / due / streak
                 Learning Profile
```

- **CL silinmez / bozulmaz:** mevcut `useLessonLoader` + manifest path’leri kaynak olur.  
- **PL büyür:** kullanıcı Memolandum’u “kendi sözlüğü + antrenmanı” olarak görür.  
- **Deck karışımı (varsayılan v1):** örn. %40 PL (weak/due) + %40 CL (hedef seviye/kategori) + %20 yeni keşif (CL veya taze PL). Oranlar remote-config ile ayarlanır.

### 3A.2 “Bizde olmayan kelime” intake (PL Ingest)

Kaynaklar:

| Kaynak | Tetik | Not |
|--------|-------|-----|
| Anlık çeviri → Kasa | Bookmark | `origin: instant_translate` |
| Manuel ekleme | Kasa / “Kelimemı ekle” | Metin + hedef dil |
| Quiz “bilmiyorum” / yanlış | Weak Spot | Lemma + bağlam |
| (Faz 2) Oyun pause “kasaya at” | | |

**Pipeline (FR-PL-1…):**

1. **Normalize:** trim, lowercase key, dil kodu, unicode NFKC.  
2. **Match CL:** aynı `langPair` içinde fuzzy/exact (`english` / lemma).  
   - Eşleşirse → PL kaydı `linkedCanonicalId` alır (CL’den audio/çeviri miras).  
   - Eşleşmezse → `status: pending_enrichment`.  
3. **AI Enrich (yalnızca unknown):** çeviri(ler), kısa örnek cümle, POS/tahmini CEFR, romanizasyon (gerekirse). **Uydurma ID yok** — yeni `userWordId`.  
4. **Human/auto gate:** toksik / boş / çok uzun reddi; cümle kaydı vs kelime ayrımı.  
5. **PL’ye yaz + Learning Profile’da mastery=düşük, due=now.**  
6. Bir sonraki AdaptiveDeck’te `priority: user_new | weak`.

**FR-PL-X (kritik):** AI enrich çıktısı structured JSON; kelime CL’ye yazılmaz. Global katkıyı istiyorsak faz 2’de `communityCandidates` kuyruğu (moderation).

### 3A.3 Habit / “bağımlılık” (etik alışkanlık)

Ürün dili: bağımlılık = **kaybetmek istemeyeceği kişisel ilerleme**, dark pattern değil.

| Mekanik | Amaç |
|---------|------|
| Günlük “5 zayıf kapanış” quest | Kısa dönüş |
| PL büyüme sayacı (“Kasanda 47 kelime”) | Sahiplik |
| Streak + Boss Check | Ritüel |
| “Dün eklediğin X bugün oyunda” | Cause–effect, AI görünürlüğü |
| CL rozetleri (A1 tamam) yanı sıra **PL rozetleri** | Kimlik |

### 3A.4 AdaptiveDeck güncellemesi

```json
{
  "deckId": "adp_…",
  "langPair": "en-tr",
  "mix": { "pl": 0.4, "cl": 0.4, "discover": 0.2 },
  "words": [
    { "id": "…", "source": "pl|cl", "priority": "weak|due|user_new|reinforce|discover", "linkedCanonicalId": null }
  ],
  "rationaleShort": "3 senin kelimen + 4 zayıf bucket + 1 keşif",
  "expiresAt": 0
}
```

**FR-9b** Planner kelime uydurmaz: yalnızca PL id + CL id listesinden seçer.  
**FR-9c** PL boşsa deck %100 CL (mevcut seviye seçimi) — cold start kırılmaz.
---

## 4. Kullanıcı & konumlandırma

### 4.1 Persona

- **Günübirlik oyuncu:** Kısa seans, eğlence; fark etmeden pekiştirme.  
- **Sınav odaklı:** YDS/YKS vb.; zayıf kelimelerin sistematik kapanması.  
- **Çok dilli learner:** Dil çifti seçer; adaptive motor dil paketinden bağımsız çalışır.

### 4.2 Konumlandırma cümlesi

> Memolandum, oyunlarla beceri antrenmanı yaptıran; quiz ve oyun verisini AI ile işleyerek bir sonraki seviyeyi kişiselleştiren dil öğrenme platformudur.

### 4.3 Google / “AI startup” uyumu

AI, **birincil ürün döngüsünün** (ölç → planla → antrenman yaptır) çekirdeğidir; yalnızca yardımcı widget değildir.  
v1’de hibrit kabul edilir: kural tabanlı SRS + Gemini ile set/zorluk önerisi.

---

## 5. Çözüm özeti — Adaptive Learning Loop

```
┌──────────────┐                    ┌─────────────────────┐
│ GCS Buckets  │ ── candidate ────► │ Canonical Lexicon   │
│ (CL JSON)    │                    └──────────┬──────────┘
└──────────────┘                               │
┌──────────────┐   normalize+enrich            │ mix
│ User intake  │ ──► Personal Lexicon (PL) ────┤
│ çeviri/yazma │                               ▼
└──────────────┘                    ┌─────────────────────┐
┌──────────────┐  events            │ Learning Profile    │
│ Quiz + Oyun  │ ─────────────────► └──────────┬──────────┘
└──────▲───────┘                               │
       │                            ┌──────────▼──────────┐
       │         AdaptiveDeck       │ AI Level Planner    │
       └────────────────────────────┤ PL + CL + mastery   │
                                    └─────────────────────┘
```

**Tek cümle:** Bucket kaliteli havuzu tutar; kullanıcı yeni kelimeyi PL’ye kazandırır; quiz/oyun ölçer; AI ikisinden kişisel level kurar.

---

## 6. Fonksiyonel gereksinimler

### 6.1 Learning Events (zorunlu)

Tüm quiz ve oyun oturumları standart olay üretir.

| Alan | Tip | Açıklama |
|------|-----|----------|
| `uid` | string \| null | null = misafir (local) |
| `wordId` | string | İçerik kimliği |
| `langPair` | string | örn. `en-tr` |
| `surface` | enum | `quiz` \| `shooter` \| `breakout` \| … \| `translate` |
| `result` | enum | `correct` \| `wrong` \| `skip` \| `timeout` |
| `latencyMs` | number | Tepki süresi |
| `strengthDelta` | number | Profil güncellemesi |
| `sessionId` | string | Oturum bağlama |
| `ts` | number | Epoch ms |

**FR-1** Oyun bitişinde ve quiz cevabında event yazılır (batch OK).  
**FR-2** Misafir: `localStorage` / IndexedDB; girişte cloud’a merge.  
**FR-3** Event şeması versiyonlanır (`schemaVersion: 1`).

### 6.2 Learning Profile

Kullanıcı başına kelime durum özeti.

| Alan | Açıklama |
|------|---------|
| `mastery` | 0–1 veya 1–5 strength |
| `dueAt` | Sonraki tekrar zamanı (SRS benzeri) |
| `wrongStreak` / `correctStreak` | Seri |
| `lastSeenAt` | Son görülme |
| `sources` | quiz / oyun / translate / vault |

**FR-4** Profile AI’nin ham prompt’u değil; **özet snapshot** gider (maliyet + gizlilik).  
**FR-5** Mevcut `vocabularyVault` strength/lastSeen ile uyumlu veya migrate edilir.

### 6.3 Nokta atışlı Quiz (oyun mantığı)

Kısa, tek amaçlı quiz modları (örnek v1 seti):

| Quiz tipi | Süre / uzunluk | Ölçtüğü şey |
|-----------|----------------|-------------|
| **Blitz** | 60 sn, 8–12 soru | Tanıma hızı |
| **Weak Spot** | 5–8 soru | En zayıf N kelime |
| **Boss Check** | Level sonrası 3 soru | Seans pekiştirme |
| **Vault Pulse** | Kasadan 5 kelime | Kullanıcı kelimeleri |

**FR-6** Quiz UI oyun HUD dilini kullanır (skor, streak, süre, “stage”).  
**FR-7** Her cevap → Learning Event.  
**FR-8** Quiz sonunda “AI Antrenmanını Başlat” CTA → AdaptiveDeck ile oyun seçimine veya direkt oyuna.

### 6.4 AI Level Planner

**Girdi (snapshot):** dil çifti, hedef CEFR/kategori (opsiyonel), zayıf kelime listesi (top K), due kelimeler, son 20 event özeti, tercih edilen oyun(lar).

**Çıktı (AdaptiveDeck JSON):**

```json
{
  "deckId": "adp_…",
  "langPair": "en-tr",
  "gameHint": ["shooter", "breakout"],
  "difficulty": 0.35,
  "words": [
    { "id": "…", "english": "…", "turkish": "…", "priority": "weak|due|new|reinforce" }
  ],
  "rationaleShort": "3 zayıf + 2 due + 1 yeni",
  "expiresAt": 0
}
```

**FR-9** Model: mevcut Firebase AI Logic / `gemini-flash-lite` (veya planlayıcı için ayrı model adı).  
**FR-10** `thinkingBudget: 0` + structured JSON schema (çeviri MVP ile aynı disiplin).  
**FR-11** Hibrit: kelime seçiminin %70’i kural (SRS/wrong), %30 AI sıralama/gerekçe; AI fail olursa **kural-only fallback**.  
**FR-12** Aynı snapshot için deck cache (TTL 15–60 dk) — tekrar çağrı yok.  
**FR-13** Deck, mevcut oyun motorlarının beklediği word array formatına map edilir (breaking change minimize).

### 6.5 Oyun entegrasyonu

**FR-14** Adaptive mod açıldığında oyun, GCS sabit level yerine `AdaptiveDeck.words` ile başlar.  
**FR-15** Oyun içi HUD’da “Kişisel antrenman” rozeti (şeffaf, abartısız).  
**FR-16** Seans sonunda XP/gems mevcut `applySessionProgress` ile uyumlu kalır + learning events eklenir.  
**FR-17** v1’de en az **2 oyun** adaptive deck kabul eder (öneri: Shooter + Breakout); diğerleri faz 2.

### 6.6 Anlık çeviri & kasa köprüsü

**FR-18** Translate → vault kaydı `origin: instant_translate` ile profile `new/weak` aday olarak girer.  
**FR-19** Vault Pulse quiz’i bu kelimeleri önceliklendirebilir.

---

## 7. UX gereksinimleri

**UX-1** Ana akışta 4. adım opsiyonel: `Quiz ile ısıt` → `Kişisel oyun`.  
**UX-2** Misafir de local adaptive kullanabilir; “İlerlemeyi buluta taşı” teşviki.  
**UX-3** AI üretimi sırasında skeleton / “Antrenman hazırlanıyor…” ≤ 3 sn; aşımda fallback deck.  
**UX-4** Kullanıcı rationale’ı görebilir (“Neden bu kelimeler?” — tek cümle).  
**UX-5** Mobil: quiz tek parmak, 44px hedefler; oyun öncesi quiz ekranı scroll’suz mümkünse.

---

## 8. Teknik mimari (mevcut stack’e oturtma)

| Bileşen | Öneri |
|---------|--------|
| Client | Next.js static export (`out/`), React, Zustand |
| Auth / DB | Firebase Auth + Firestore |
| AI | Firebase AI Logic + `GoogleAIBackend` (mevcut çeviri hattı) |
| App Check | reCAPTCHA Enterprise (enforcement kademeli) |
| Event yazma | Client batch + isteğe bağlı Callable Function aggregate |
| İçerik havuzu | Mevcut GCS vocab JSON’lar = candidate pool |
| Motorlar | `src/engines/*` + `src/components/games/*` — word inject API |

### 8.1 Önerilen Firestore şekli

```
users/{uid}/learningProfile/{wordId}     # mastery, dueAt, source pl|cl
users/{uid}/personalLexicon/{wordId}     # user words + enrich + linkedCanonicalId
users/{uid}/learningEvents/{eventId}
users/{uid}/adaptiveDecks/{deckId}
# CL: mevcut GCS paths (manifest) — Firestore’a kopyalanmaz (v1)
# opsiyonel faz 2:
communityCandidates/{id}                 # PL→CL katkı kuyruğu (moderation)
```

Misafir: `localStorage` key `memolandum-learning-v1` + `memolandum-pl-v1`.

### 8.2 Güvenlik

- Profil ve event’ler yalnızca sahibi R/W (`firestore.rules`).  
- AI’ye PII (e-posta, isim) gitmez; sadece wordId + anonim istatistik.  
- Rate limit: kullanıcı başına deck üretimi (ör. 20/saat).

---

## 9. Fazlar

### Faz 0 — Temel (1–2 hafta)

- Learning Event şeması + client collector  
- Profile updater (kural tabanlı SRS, AI yok)  
- Boss Check quiz (oyun sonrası 3 soru)  
- PL iskeleti = mevcut vault şemasına map (`personalLexicon` veya vault alias)  
- Telemetri: event sayısı, quiz completion, PL size  

### Faz 1 — MVP Adaptive + PL intake (2–4 hafta) ← “AI core” minimumu

- Weak Spot + Blitz quiz  
- **PL Ingest:** çeviri→kasa + manuel ekle + CL match / AI enrich (unknown)  
- AI Level Planner: **PL+CL mix** AdaptiveDeck  
- 2 oyunda deck inject + fallback  
- Cold start: PL boş → %100 CL (seçilen bucket level)  
- Cache + App Check hazırlığı  
- “Kişisel antrenman” giriş noktası  

### Faz 2 — Genişleme

- 6 oyunun tümü  
- Vault Pulse + “dün eklediğin kelime bugün oyunda”  
- Habit: günlük zayıf quest, PL sayacı, streak  
- communityCandidates (PL→CL öneri, moderation)  

### Faz 3 — Optimizasyon

- Offline event/PL queue  
- Model A/B, enrich maliyeti  
- Öğrenme + lexikon dashboard (profil)

---

## 10. Kabul kriterleri (Faz 1 Done)

1. Kullanıcı Blitz veya Weak Spot tamamlayınca profil güncellenir.  
2. Bucket'ta olmayan bir kelime çeviri/manuel ile eklenince PL'ye yazılır; AI enrich veya CL link çalışır.  
3. "Kişisel antrenman" deck'i PL+CL karışımı üretir (PL boşken %100 CL).  
4. Shooter veya Breakout bu deck ile oynanır; seans event'leri yazılır.  
5. AI fail'de kural deck; cache ile gereksiz tekrar çağrı yok.  
6. Mevcut 3 tıklı bucket level akışı bozulmadan yan yana yaşar.  
7. Misafir PL local'de çalışır; girişte merge bozulmaz.

---

## 11. Riskler & mitigasyon

| Risk | Mitigasyon |
|------|------------|
| AI maliyeti (plan + enrich) | Cache, lite, enrich yalnız unknown, rate limit |
| Kullanıcı çöp kelime / spam | Uzunluk, dil, toxicity gate; PL kotası |
| CL kalitesi bozulur | PL asla otomatik CL'ye yazılmaz |
| Yanlış çeviri enrich | Kullanıcı edit; linked CL tercih |
| Deck'te sadece PL, ilerleme daralır | mix floor: min %CL keşif |
| "AI tiyatrosu" | Rationale + PL büyümüş retention metrikleri |
| Gizlilik | PII'siz snapshot; PL private by default |

---

## 12. Bağımlılıklar

- Mevcut: GCS vocab (manifest + useLessonLoader), Firebase AI Logic, vault, progress, 6 oyun.  
- Yeni: PL ingest/enrich, event collector, profile, quiz, deck inject, mix policy.  
- Opsiyonel: Callable Function (sunucu planlama / enrich kotası).

---

## 13. Açık sorular (onay için)

1. Adaptive varsayılan mı, yoksa "Kişisel antrenman" ayrı giriş mi?  
2. Quiz zorunlu ısınma mı, yoksa atlanabilir mi?  
3. v1 deck mix oranı? (öneri 40/40/20 PL/CL/discover)  
4. Unknown enrich zorunlu mu, yoksa ham metinle oyuna girer mi?  
5. PL→CL community katkı v1'de hiç yok mu (önerilen: yok, faz 2)?  
6. CEFR/kategori filtresi v1'de zorunlu mu?  
7. AI Planner/Enrich client-side mı, Functions mı?

---

## 13A. Abuse & Bot savunması (istemci modülleri — v1.1)

Kod: `src/lib/security/` (mevcut UI/oyunları bozmadan eklendi).

| Modül | Görev |
|-------|--------|
| `contentGate.js` | Uzunluk, spam tekrar, URL, boş/noktalama |
| `rateLimit.js` | localStorage kayan pencere kota |
| `abuseGuard.js` | `assertAllowed` / `commitAbuse` + davranış sinyali |

Politika örnekleri (misafir / üye, günlük): çeviri 40/120, ses 12/40, kasaya ekleme 25/80.  
Hiç oyun oynamadan aşırı kasaya ekleme yumuşak engellenir (`recordPlaySignal` oyun progress ile).

**Bağlı yerler:** `translateService`, `QuickTranslateBar` vault, `applySessionProgress`.  
**Firestore rules:** vault alan boyutu sınırları.  
**Sonraki katman:** App Check enforcement + Cloud Functions sunucu kotası.

---

## 14. Onay

| Rol | İsim | Tarih | İmza |
|-----|------|-------|------|
| Product | | | |
| Engineering | | | |
| Design | | | |

---

*v1.1: Bucket kanonik havuz; kullanıcı kelimesi kişisel lexikon; AI ikisini birleştirerek bireyselleştirilmiş ve alışkanlık oluşturan antrenman üretir. Anlık çeviri intake kanalıdır; adaptive PL+CL döngüsü birincil AI ürünüdür.*
