import { Storage } from '@google-cloud/storage';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../public/data');
const CORS_FILE = path.resolve(__dirname, 'gcs-cors.json');
const SERVICE_ACCOUNT_FILE = path.resolve(__dirname, '../functions/serviceAccountKey.json');
const FIREBASE_CLI_CONFIG = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

const BUCKET_NAME = 'memolandum-33dc4.firebasestorage.app';
const CONCURRENCY = 150; // Upload 150 files in parallel

// Recursive folder walker
function getFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, fileList);
    } else {
      fileList.push(name);
    }
  }
  return fileList;
}

async function initializeStorage() {
  // Option 1: Try Service Account Key
  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      console.log('🔑 Authenticating using local serviceAccountKey.json...');
      const storage = new Storage({
        projectId: 'memolandum-33dc4',
        keyFilename: SERVICE_ACCOUNT_FILE
      });
      await storage.bucket(BUCKET_NAME).getMetadata();
      console.log('✅ Service account credentials are valid.');
      return storage;
    } catch (e) {
      console.warn('⚠️ Service account key failed:', e.message);
      console.log('Falling back to Firebase CLI credentials...');
    }
  }

  // Option 2: Try Firebase CLI session token
  if (fs.existsSync(FIREBASE_CLI_CONFIG)) {
    try {
      console.log('🔄 Authenticating using Firebase CLI session token...');
      const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG, 'utf8'));
      if (config.tokens && config.tokens.access_token) {
        const authClient = new OAuth2Client();
        authClient.setCredentials({
          access_token: config.tokens.access_token
        });
        
        const storage = new Storage({
          projectId: 'memolandum-33dc4',
          authClient: authClient
        });
        await storage.bucket(BUCKET_NAME).getMetadata();
        console.log('✅ Firebase CLI credentials are valid.');
        return storage;
      }
    } catch (e) {
      console.error('❌ Firebase CLI credentials failed:', e.message);
    }
  }

  throw new Error('Could not load any valid credentials. Please run "npx firebase login" and try again.');
}

async function run() {
  const forceClean = process.argv.includes('--clean');
  
  try {
    const storage = await initializeStorage();
    const bucket = storage.bucket(BUCKET_NAME);

    // 1. Configure CORS
    console.log('🌐 Configuring CORS policy on GCS bucket...');
    if (fs.existsSync(CORS_FILE)) {
      const corsConfig = JSON.parse(fs.readFileSync(CORS_FILE, 'utf8'));
      await bucket.setCorsConfiguration(corsConfig);
      console.log('✅ CORS policy successfully applied to bucket.');
    } else {
      console.warn('⚠️ CORS config file not found. Skipping CORS setup.');
    }

    // 2. Clear existing files if --clean flag is present
    if (forceClean) {
      console.log('🧹 Cleaning old database files from server (gs://' + BUCKET_NAME + '/data/)...');
      await bucket.deleteFiles({ prefix: 'data/' });
      console.log('✅ Server database directory successfully cleared.');
    }

    // 3. Retrieve currently uploaded files to skip duplicates
    console.log('🔍 Listing already uploaded files on bucket...');
    const existingFileNames = new Set();
    try {
      const [files] = await bucket.getFiles({ prefix: 'data/' });
      files.forEach(f => existingFileNames.add(f.name));
      console.log(`Found ${existingFileNames.size} files already on the server.`);
    } catch (err) {
      console.warn('⚠️ Could not check existing files, starting clean upload:', err.message);
    }

    // 4. Scan local public/data directory
    console.log('📂 Scanning local public/data directory...');
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Data directory not found at: ${DATA_DIR}`);
    }

    const localFiles = getFiles(DATA_DIR);
    
    // Filter local files to only upload what's missing
    const filesToUpload = localFiles.filter(localPath => {
      const relativePath = path.relative(DATA_DIR, localPath).replace(/\\/g, '/');
      const gcsDestination = `data/${relativePath}`;
      return !existingFileNames.has(gcsDestination);
    });

    console.log(`Total files local: ${localFiles.length}`);
    console.log(`Files to upload (missing): ${filesToUpload.length}`);

    if (filesToUpload.length === 0) {
      console.log('🎉 All files are already synced! Nothing to upload.');
      return;
    }

    console.log(`Starting parallel upload with concurrency = ${CONCURRENCY}...`);

    let uploadedCount = 0;
    let nextIndex = 0;

    async function worker() {
      while (nextIndex < filesToUpload.length) {
        const currentIdx = nextIndex++;
        const localFilePath = filesToUpload[currentIdx];
        
        const relativePath = path.relative(DATA_DIR, localFilePath).replace(/\\/g, '/');
        const gcsDestination = `data/${relativePath}`;
        
        const fileExtension = path.extname(localFilePath).toLowerCase();
        let contentType = 'application/octet-stream';
        if (fileExtension === '.json') {
          contentType = 'application/json; charset=utf-8';
        } else if (fileExtension === '.mp3') {
          contentType = 'audio/mpeg';
        }

        try {
          const [file] = await bucket.upload(localFilePath, {
            destination: gcsDestination,
            metadata: {
              contentType: contentType,
              cacheControl: 'public, max-age=31536000'
            }
          });

          await file.makePublic();

          uploadedCount++;
          if (uploadedCount % 100 === 0 || uploadedCount === filesToUpload.length) {
            console.log(`  Uploaded [${uploadedCount}/${filesToUpload.length}] files...`);
          }
        } catch (uploadError) {
          console.error(`❌ Failed to upload ${relativePath}:`, uploadError.message);
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, worker);
    await Promise.all(workers);

    console.log(`\n🎉 Success! Database sync complete.`);
    console.log(`Total files newly uploaded: ${uploadedCount}`);
    console.log(`Assets base URL: https://storage.googleapis.com/${BUCKET_NAME}/data/`);
  } catch (error) {
    console.error('❌ GCS Bucket Sync Failed:', error.message);
    console.log('\n💡 Hint: If access token has expired, run "npx firebase projects:list" to refresh it, then try again.');
    process.exit(1);
  }
}

run();
