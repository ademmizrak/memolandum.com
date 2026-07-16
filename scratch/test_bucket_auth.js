const { OAuth2Client } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BUCKET_NAME = 'memolandum-33dc4.firebasestorage.app';
const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function testAuth() {
  try {
    if (!fs.existsSync(configPath)) {
      throw new Error('Firebase CLI config not found.');
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (!config.tokens || !config.tokens.refresh_token) {
      throw new Error('Refresh token not found in config.');
    }

    console.log('🔄 Authenticating using Firebase CLI session...');
    // Default Firebase CLI Client Credentials
    const oauth2Client = new OAuth2Client(
      '105872658826-pif88ks8c3ncf3b85k65uq2fco4u9i0h.apps.googleusercontent.com',
      '33n1us3756209802'
    );
    oauth2Client.setCredentials({
      refresh_token: config.tokens.refresh_token
    });

    const response = await oauth2Client.getAccessToken();
    const accessToken = response.token;
    console.log('✅ Access token successfully generated.');
  } catch (err) {
    console.error('❌ Authentication failed:', err.message);
  }
}

testAuth();
