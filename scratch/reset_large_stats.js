const fs = require('fs');
const path = require('path');
const os = require('os');

const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');

async function getAccessToken() {
  if (!fs.existsSync(configPath)) {
    throw new Error('Firebase CLI config not found.');
  }
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!config.tokens || !config.tokens.access_token) {
    throw new Error('Access token not found in config.');
  }
  return config.tokens.access_token;
}

async function cleanupStats() {
  try {
    console.log('🔄 Loading Google OAuth Token directly from Firebase CLI config...');
    const token = await getAccessToken();
    console.log('🔑 Authenticated successfully.');

    // 1. Get all documents under users
    const usersUrl = 'https://firestore.googleapis.com/v1/projects/memolandum-33dc4/databases/(default)/documents/users?pageSize=100';
    const usersRes = await fetch(usersUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!usersRes.ok) {
      throw new Error(`Failed to list users: ${usersRes.statusText}`);
    }
    const usersData = await usersRes.json();
    const documents = usersData.documents || [];

    console.log(`👤 Found ${documents.length} users in Firestore.`);

    for (const doc of documents) {
      const parts = doc.name.split('/');
      const uid = parts[parts.length - 1];
      
      const displayName = doc.fields?.displayName?.stringValue || "Unknown";
      console.log(`\nChecking stats for user: ${displayName} (UID: ${uid})`);

      // 2. Fetch stats/global subcollection document
      const statsUrl = `https://firestore.googleapis.com/v1/projects/memolandum-33dc4/databases/(default)/documents/users/${uid}/stats/global`;
      const statsRes = await fetch(statsUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsRes.status === 404) {
        console.log(`  No global stats document found for ${displayName}.`);
        continue;
      }

      if (!statsRes.ok) {
        console.error(`  Error fetching stats for ${displayName}: ${statsRes.statusText}`);
        continue;
      }

      const statsDoc = await statsRes.json();
      const fields = statsDoc.fields || {};

      const totalScore = parseInt(fields.total_score?.integerValue || '0', 10);
      const totalXp = parseInt(fields.total_xp?.integerValue || '0', 10);
      const gems = parseInt(fields.gems?.integerValue || '0', 10);

      console.log(`  Current Stats -> Score: ${totalScore}, XP: ${totalXp}, Gems: ${gems}`);

      // If stats are inflated (e.g. score > 20,000 or gems > 20,000 or anything astronomical)
      if (totalScore > 10000 || gems > 10000 || totalXp > 1000) {
        console.log(`  ⚠️ Inflated stats detected! Resetting to a clean baseline (0)...`);
        
        // Reset stats document
        const resetPayload = {
          fields: {
            total_score: { integerValue: '0' },
            total_xp: { integerValue: '0' },
            gems: { integerValue: '0' },
            game_breakdown: { mapValue: { fields: {} } }
          }
        };

        const resetRes = await fetch(statsUrl, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(resetPayload)
        });

        if (resetRes.ok) {
          console.log(`  ✅ Stats successfully reset to 0 for ${displayName}!`);
        } else {
          console.error(`  ❌ Failed to reset stats for ${displayName}: ${resetRes.statusText}`);
        }
      } else {
        console.log(`  Keep stats (within normal limits).`);
      }
    }

  } catch (err) {
    console.error('❌ Error during cleanup:', err.message);
  }
}

cleanupStats();
