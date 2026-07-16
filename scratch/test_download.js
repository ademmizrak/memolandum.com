async function testFetch() {
  const url = "https://storage.googleapis.com/memolandum-33dc4.firebasestorage.app/data/Arabic/content/ar_tr/words_ar_tr.json";
  console.log('Fetching:', url);
  try {
    const response = await fetch(url);
    console.log('Status:', response.status);
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Items count:', data.length);
      console.log('First item:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('Failed! Status text:', response.statusText);
    }
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testFetch();
