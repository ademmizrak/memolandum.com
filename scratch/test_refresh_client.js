const { UserRefreshClient } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function testRefresh() {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const refreshToken = config.tokens.refresh_token;

    console.log('Testing UserRefreshClient with public client ID...');
    const client = new UserRefreshClient({
      clientId: '517492160913-6d0tmsn57ngb79m901509up4osg6i7o7.apps.googleusercontent.com',
      clientSecret: '4m1g5w7wt22a7fec467d',
      refreshToken: refreshToken
    });

    const credentials = await client.refreshAccessToken();
    console.log('✅ Success with standard clientSecret!');
    console.log('Access token:', credentials.credentials.access_token.substring(0, 10) + '...');
  } catch (err) {
    console.error('❌ Failed with standard clientSecret:', err.message);

    try {
      console.log('Testing UserRefreshClient with NO clientSecret...');
      const client = new UserRefreshClient({
        clientId: '517492160913-6d0tmsn57ngb79m901509up4osg6i7o7.apps.googleusercontent.com',
        refreshToken: refreshToken
      });

      const credentials = await client.refreshAccessToken();
      console.log('✅ Success with NO clientSecret!');
      console.log('Access token:', credentials.credentials.access_token.substring(0, 10) + '...');
    } catch (err2) {
      console.error('❌ Failed with NO clientSecret:', err2.message);
    }
  }
}

testRefresh();
