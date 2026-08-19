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

const PLAYLISTS = [
  {
    id: 'PLCUnEnlWOZks',
    category: '1sınıf',
    name: '1. Sınıf İngilizce Kelimeler'
  },
  {
    id: 'PLVJiYMmTRL6Q',
    category: '2sınıf',
    name: '2. Sınıf İngilizce Kelimeler'
  },
  {
    id: 'PLfBLrT1zXg5Q',
    category: '3sınıf',
    name: '3. Sınıf İngilizce Kelimeler'
  },
  {
    id: 'PLQcz8qT1zIlo',
    category: '4sınıf',
    name: '4. Sınıf İngilizce Kelimeler'
  },
  {
    id: 'PLIPQg5gPlmjw',
    category: 'yds',
    name: 'YDS İngilizce Kelimeler'
  },
  {
    id: 'PLJeCMc56Po-U',
    category: 'a2',
    name: 'Learn English A2: Daily Routines'
  }
];

async function fetchPlaylistVideos(playlistId) {
  const videos = [];
  let nextPageToken = '';
  
  do {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}&key=${API_KEY}`;
    const res = await fetch(url).then(r => r.json());
    
    if (res.error) {
      throw new Error(`YouTube API Error: ${res.error.message}`);
    }
    
    if (res.items) {
      for (const item of res.items) {
        const snippet = item.snippet;
        const videoId = snippet.resourceId.videoId;
        videos.push({
          id: videoId,
          title: snippet.title,
          description: snippet.description || '',
          thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
          publishedAt: snippet.publishedAt
        });
      }
    }
    nextPageToken = res.nextPageToken || '';
  } while (nextPageToken);

  return videos;
}

async function main() {
  console.log('🏁 Starting YouTube Playlist Sync...');
  const result = {};

  for (const pl of PLAYLISTS) {
    console.log(`fetching videos for playlist: ${pl.name} (${pl.id})...`);
    try {
      const videos = await fetchPlaylistVideos(pl.id);
      result[pl.category] = {
        playlistId: pl.id,
        name: pl.name,
        videos: videos
      };
      console.log(`✅ Fetched ${videos.length} videos.`);
    } catch (err) {
      console.error(`❌ Error fetching playlist ${pl.name}:`, err.message);
    }
  }

  const outputPath = path.join(ROOT, 'public', 'data', 'youtube_videos.json');
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`💾 Saved synced data to: ${outputPath}`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
