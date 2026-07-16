const { UserRefreshClient } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function testRefreshPositional() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const refreshToken = config.tokens.refresh_token;

    console.log('Testing UserRefreshClient with positional parameters...');
    // Firebase CLI client ID and client secret
    const client = new UserRefreshClient(
      '517492160913-6d0tmsn57ngb79m901509up4osg6i7o7.apps.googleusercontent.com',
      '4m1g5w7wt22a7fec467d',
      refreshToken
    );

    const credentials = await client.refreshAccessToken();
    console.log('✅ Success with positional!');
    console.log('Access token:', credentials.credentials.access_token.substring(0, 10) + '...');
  } catch (err) {
    console.error('❌ Failed with positional:', err.message);
  }
}

testRefreshPositional();
