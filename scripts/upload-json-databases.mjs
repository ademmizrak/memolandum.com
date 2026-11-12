import { Storage } from '@google-cloud/storage';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../public/data');
const BUCKET_NAME = 'memolandum-33dc4.firebasestorage.app';
const SERVICE_ACCOUNT_FILE = path.resolve(__dirname, '../functions/serviceAccountKey.json');
const FIREBASE_CLI_CONFIG = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

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
  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    try {
      console.log('🔑 Authenticating using local serviceAccountKey.json...');
      return new Storage({
        projectId: 'memolandum-33dc4',
        keyFilename: SERVICE_ACCOUNT_FILE
      });
    } catch (e) {
      console.warn('⚠️ Service account key failed:', e.message);
    }
  }

  if (fs.existsSync(FIREBASE_CLI_CONFIG)) {
    try {
      console.log('🔄 Authenticating using Firebase CLI session token...');
      const config = JSON.parse(fs.readFileSync(FIREBASE_CLI_CONFIG, 'utf8'));
      if (config.tokens && config.tokens.access_token) {
        const authClient = new OAuth2Client();
        authClient.setCredentials({
          access_token: config.tokens.access_token
        });
        return new Storage({
          projectId: 'memolandum-33dc4',
          authClient: authClient
        });
      }
    } catch (e) {
      console.error('❌ Firebase CLI credentials failed:', e.message);
    }
  }
  throw new Error('Could not load any valid credentials.');
}

async function run() {
  try {
    const storage = await initializeStorage();
    const bucket = storage.bucket(BUCKET_NAME);

    console.log('📂 Scanning local JSON databases to upload...');
    const localFiles = getFiles(DATA_DIR);
    
    // Filter to only upload JSON files (excluding manifest.json and audioMap.json)
    const jsonFiles = localFiles.filter(f => 
      f.endsWith('.json') && 
      !f.includes('manifest.json') && 
      !f.includes('audioMap.json')
    );

    console.log(`Found ${jsonFiles.length} JSON database files to upload.`);

    let uploadedCount = 0;
    for (const localFilePath of jsonFiles) {
      const relativePath = path.relative(DATA_DIR, localFilePath).replace(/\\/g, '/');
      const gcsDestination = `data/${relativePath}`;

      console.log(`📤 Uploading: ${relativePath} -> gs://${BUCKET_NAME}/${gcsDestination}`);
      
      const [file] = await bucket.upload(localFilePath, {
        destination: gcsDestination,
        metadata: {
          contentType: 'application/json; charset=utf-8',
          cacheControl: 'public, max-age=3600' // shorter cache age for database files
        }
      });

      await file.makePublic();
      uploadedCount++;
    }

    console.log(`\n🎉 Success! Uploaded ${uploadedCount} JSON database files.`);
  } catch (error) {
    console.error('❌ Upload Failed:', error.message);
  }
}

run();
