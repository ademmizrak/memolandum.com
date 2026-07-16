const { Storage } = require('@google-cloud/storage');
const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BUCKET_NAME = 'memolandum-33dc4.firebasestorage.app';
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function testAccessToken() {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error('Firebase CLI config not found.');
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.tokens || !config.tokens.access_token) {
      throw new Error('Access token not found in config.');
    }

    console.log('Using access token directly via OAuth2Client...');
    const authClient = new OAuth2Client();
    authClient.setCredentials({
      access_token: config.tokens.access_token
    });

    const storage = new Storage({
      projectId: 'memolandum-33dc4',
      authClient: authClient
    });

    const bucket = storage.bucket(BUCKET_NAME);
    const [metadata] = await bucket.getMetadata();
    console.log('🎉 Access token is VALID!');
    console.log('Bucket Location:', metadata.location);
  } catch (err) {
    console.error('❌ Access token failed:', err.message);
  }
}

testAccessToken();
