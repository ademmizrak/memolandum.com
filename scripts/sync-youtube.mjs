import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

function loadYoutubeApiKey() {
  if (process.env.YOUTUBE_API_KEY) return process.env.YOUTUBE_API_KEY;
  for (const envFile of ['.env.local', '.env']) {
    const envPath = path.join(ROOT, envFile);
    if (!fs.existsSync(envPath)) continue;
    const match = fs.readFileSync(envPath, 'utf8').match(/^YOUTUBE_API_KEY=["']?([^"'\n]+)["']?/m);
    if (match) return match[1];
  }
  return null;
}

const API_KEY = loadYoutubeApiKey();
if (!API_KEY) {
  console.error('YOUTUBE_API_KEY env var is required');
  process.exit(1);
}

const CHANNEL_HANDLE = 'memolandum';

const KNOWN_PLAYLISTS = [
  {
    id: 'PLCUnEnlWOZks',
    category: '1sınıf',
    name: '1. Sınıf İngilizce Kelimeler',
    shortName: '1. Sınıf',
    shortNameEn: '1st Grade',
    group: 'grade',
    order: 10
  },
  {
    id: 'PLVJiYMmTRL6Q',
    category: '2sınıf',
    name: '2. Sınıf İngilizce Kelimeler',
    shortName: '2. Sınıf',
    shortNameEn: '2nd Grade',
    group: 'grade',
    order: 20
  },
  {
    id: 'PLfBLrT1zXg5Q',
    category: '3sınıf',
    name: '3. Sınıf İngilizce Kelimeler',
    shortName: '3. Sınıf',
    shortNameEn: '3rd Grade',
    group: 'grade',
    order: 30
  },
  {
    id: 'PLQcz8qT1zIlo',
    category: '4sınıf',
    name: '4. Sınıf İngilizce Kelimeler',
    shortName: '4. Sınıf',
    shortNameEn: '4th Grade',
    group: 'grade',
    order: 40
  },
  {
    id: 'PLLAH79He1R6w',
    category: '5sınıf',
    name: '5. Sınıf İngilizce Kelimeler',
    shortName: '5. Sınıf',
    shortNameEn: '5th Grade',
    group: 'grade',
    order: 50
  },
  {
    id: 'PLSHmX-n68wJQ',
    category: '6sınıf',
    name: '6. Sınıf İngilizce Kelimeler',
    shortName: '6. Sınıf',
    shortNameEn: '6th Grade',
    group: 'grade',
    order: 60
  },
  {
    id: 'PLVDs2XBuaEmE',
    category: '7sınıf',
    name: '7. Sınıf İngilizce Animasyon & K-Pop',
    shortName: '7. Sınıf',
    shortNameEn: '7th Grade',
    group: 'grade',
    order: 70
  },
  {
    id: 'PLN8GTkXoXykc',
    category: '8sınıf',
    name: '8. Sınıf LGS İngilizce & Listening',
    shortName: '8. Sınıf (LGS)',
    shortNameEn: '8th Grade (LGS)',
    group: 'grade',
    order: 80
  },
  {
    id: 'PLIPQg5gPlmjw',
    category: 'yds',
    name: 'YDS İngilizce Kelimeler ve Eşanlamlıları',
    shortName: 'YDS Kelimeleri',
    shortNameEn: 'YDS Vocabulary',
    group: 'exam',
    order: 90
  },
  {
    id: 'PLCQ545jTnT6Q',
    category: 'hap-bilgiler',
    name: '1 Dakikada İngilizce | A1 - A2 Hap Bilgiler',
    shortName: '1 Dk Hap Bilgiler',
    shortNameEn: '1-Min Quick Tips',
    group: 'general',
    order: 100
  },
  {
    id: 'PLJeCMc56Po-U',
    category: 'a2',
    name: 'Learn English A2: Daily Routines & Professions',
    shortName: 'A2 Daily Routines',
    shortNameEn: 'A2 Daily Routines',
    group: 'general',
    order: 110
  },
  {
    id: 'PLNGbO1dN_Tu0',
    category: 'a2-travel',
    name: 'A2 English Listening: Travel & World Wonders',
    shortName: 'A2 Travel & Listening',
    shortNameEn: 'A2 Travel & Listening',
    group: 'general',
    order: 120
  },
  {
    id: 'PLCg-HGsxGnlg',
    category: 'crazy-english',
    name: 'Crazy English: Brain Hacks & Rapid Fluency',
    shortName: 'Crazy English',
    shortNameEn: 'Crazy English',
    group: 'general',
    order: 130
  },
  {
    id: 'PLYtLXOnKlTVo',
    category: 'ar-en',
    name: 'إتقان الإنجليزية خطوة بخطوة | Adım Adım İngilizce Öğren (Memolandum)',
    shortName: 'Arapça–İngilizce Konu Anlatımı',
    shortNameEn: 'Arabic–English Video Lessons',
    shortNameAr: 'إتقان الإنجليزية خطوة بخطوة',
    group: 'general',
    order: 95
  },
  {
    id: 'PLFty--cqLRvM',
    category: 'pt-en',
    name: 'Curso de Inglês do Zero (Explicado em Português) | Portekizce Anlatımlı İngilizce Dersleri',
    shortName: 'Portekizce–İngilizce Konu Anlatımı',
    shortNameEn: 'Portuguese–English Video Lessons',
    shortNamePt: 'Curso de Inglês do Zero (PT-BR)',
    group: 'general',
    order: 96
  }
];

function slugifyCategory(title, playlistId) {
  const t = String(title || '').toLowerCase();
  const gradeMatch = t.match(/([1-8])\s*\.\s*s[ıi]n[ıi]f/);
  if (gradeMatch) return `${gradeMatch[1]}sınıf`;
  if (t.includes('yds')) return 'yds';
  if (t.includes('yks')) return 'yks';
  if (t.includes('hap bilgi') || t.includes('1 dakikada')) return 'hap-bilgiler';
  const clean = t
    .replace(/\|.*$/, '')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  return clean || `pl-${playlistId.slice(-6).toLowerCase()}`;
}

async function discoverChannelPlaylists() {
  const discovered = [];
  try {
    const chUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&forHandle=${CHANNEL_HANDLE}&key=${API_KEY}`;
    const chRes = await fetch(chUrl).then(r => r.json());
    const channelId = chRes?.items?.[0]?.id;
    if (!channelId) {
      console.warn('⚠️ Could not resolve channel ID via handle, using KNOWN_PLAYLISTS only.');
      return KNOWN_PLAYLISTS;
    }

    let nextPageToken = '';
    do {
      const plUrl = `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&channelId=${channelId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`;
      const plRes = await fetch(plUrl).then(r => r.json());
      if (plRes.error) {
        console.warn('⚠️ Error listing channel playlists:', plRes.error.message);
        break;
      }
      for (const item of plRes.items || []) {
        discovered.push({
          id: item.id,
          title: item.snippet?.title || '',
          description: item.snippet?.description || ''
        });
      }
      nextPageToken = plRes.nextPageToken || '';
    } while (nextPageToken);
  } catch (err) {
    console.warn('⚠️ Channel playlist discovery failed:', err.message);
  }

  const merged = [...KNOWN_PLAYLISTS];
  const knownIds = new Set(KNOWN_PLAYLISTS.map(p => p.id));
  const usedCategories = new Set(KNOWN_PLAYLISTS.map(p => p.category));

  let extraOrder = 200;
  for (const d of discovered) {
    if (knownIds.has(d.id)) {
      const existing = merged.find(p => p.id === d.id);
      if (existing && d.title) {
        existing.channelTitle = d.title;
      }
      continue;
    }
    let cat = slugifyCategory(d.title, d.id);
    if (usedCategories.has(cat)) {
      cat = `${cat}-${d.id.slice(-4).toLowerCase()}`;
    }
    usedCategories.add(cat);
    const cleanTitle = d.title.split('|')[0].trim() || d.title;
    merged.push({
      id: d.id,
      category: cat,
      name: d.title || cleanTitle,
      shortName: cleanTitle.length > 22 ? `${cleanTitle.slice(0, 20)}…` : cleanTitle,
      shortNameEn: cleanTitle.length > 22 ? `${cleanTitle.slice(0, 20)}…` : cleanTitle,
      group: 'general',
      order: extraOrder++
    });
  }

  return merged.sort((a, b) => (a.order || 999) - (b.order || 999));
}

async function fetchPlaylistVideos(playlistId) {
  const videos = [];
  let nextPageToken = '';

  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails,status&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`;
    const res = await fetch(url).then(r => r.json());

    if (res.error) {
      throw new Error(`YouTube API Error: ${res.error.message}`);
    }

    if (res.items) {
      for (const item of res.items) {
        const snippet = item.snippet;
        if (!snippet || !snippet.resourceId?.videoId) continue;
        const title = snippet.title || '';
        if (title === 'Deleted video' || title === 'Private video') continue;
        const privacy = item.status?.privacyStatus;
        if (privacy && privacy !== 'public' && privacy !== 'unlisted') continue;

        const thumb =
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.standard?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          '';
        if (!thumb) continue;

        const videoId = snippet.resourceId.videoId;
        videos.push({
          id: videoId,
          title,
          description: snippet.description || '',
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || thumb,
          publishedAt: item.contentDetails?.videoPublishedAt || snippet.publishedAt
        });
      }
    }
    nextPageToken = res.nextPageToken || '';
  } while (nextPageToken);

  return videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}

async function main() {
  console.log('🏁 Starting YouTube Playlist Sync for @memolandum...');
  const outputPath = path.join(ROOT, 'public', 'data', 'youtube_videos.json');
  let existingData = {};
  if (fs.existsSync(outputPath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8')) || {};
    } catch {
      existingData = {};
    }
  }

  const playlists = await discoverChannelPlaylists();
  console.log(`📋 Found ${playlists.length} playlists to sync.`);

  const result = {};
  let fetchedPlaylists = 0;

  for (const pl of playlists) {
    console.log(`fetching videos for playlist: [${pl.category}] ${pl.name} (${pl.id})...`);
    try {
      const videos = await fetchPlaylistVideos(pl.id);
      result[pl.category] = {
        playlistId: pl.id,
        name: pl.channelTitle || pl.name,
        shortName: pl.shortName || pl.name,
        shortNameEn: pl.shortNameEn || pl.shortName || pl.name,
        group: pl.group || 'general',
        order: pl.order || 999,
        videos: videos
      };
      fetchedPlaylists++;
      console.log(`✅ Fetched ${videos.length} videos.`);
    } catch (err) {
      console.error(`❌ Error fetching playlist ${pl.name}:`, err.message);
      if (existingData[pl.category]) {
        result[pl.category] = existingData[pl.category];
        console.warn(`↩️ Preserved cached playlist data for [${pl.category}].`);
      }
    }
  }

  if (fetchedPlaylists === 0) {
    throw new Error('Failed to fetch any playlists from YouTube API; aborting write.');
  }

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`💾 Saved synced data to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
