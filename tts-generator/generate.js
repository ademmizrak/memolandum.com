const { GoogleGenAI } = require('@google/genai');
const fs = require('fs-extra');
const path = require('path');

// Initialize GoogleGenAI. It automatically uses process.env.GEMINI_API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function sanitizeFilename(word) {
    return word.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function getWavHeader(dataLength, sampleRate = 24000) {
    const buffer = Buffer.alloc(44);
    // RIFF chunk descriptor
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    // fmt sub-chunk
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // 16 for PCM
    buffer.writeUInt16LE(1, 20); // 1 for PCM
    buffer.writeUInt16LE(1, 22); // 1 channel
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28); // ByteRate
    buffer.writeUInt16LE(2, 32); // BlockAlign
    buffer.writeUInt16LE(16, 34); // BitsPerSample
    // data sub-chunk
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
}

async function main() {
    try {
        const wordsFilePath = path.join(__dirname, 'A1_words.json');
        const audioDir = path.join(__dirname, 'audio');

        // Validate existence of A1_words.json
        if (!await fs.pathExists(wordsFilePath)) {
            console.error(`Error: The file ${wordsFilePath} does not exist.`);
            process.exit(1);
        }

        // Ensure audio directory exists
        await fs.ensureDir(audioDir);

        // Read the words JSON
        const rawData = await fs.readFile(wordsFilePath, 'utf8');
        let words = [];
        try {
            words = JSON.parse(rawData);
        } catch (e) {
            console.error("Error: A1_words.json is not valid JSON.");
            process.exit(1);
        }

        console.log(`Total words loaded from the JSON array: ${words.length}`);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < words.length; i++) {
            const entry = words[i];
            const wordStr = entry.word;
            const id = entry.id;

            if (!wordStr || !id) {
                console.warn(`Warning: Missing 'word' or 'id' for entry at index ${i}. Skipping.`);
                failCount++;
                continue;
            }

            const safeWord = sanitizeFilename(wordStr);
            const fileName = `${id}_${safeWord}.wav`;
            const filePath = path.join(audioDir, fileName);

            // Daha önceden indirilmişse atla (API kredisini korumak için)
            if (await fs.pathExists(filePath)) {
                console.log(`✅ [Skipping] ${fileName} already exists.`);
                successCount++;
                continue;
            }

            let attempts = 0;
            let success = false;
            const maxAttempts = 10;

            // Free tier kotası için (dakikada 15 istek) her kelime arası 4.5 saniye bekleme
            await delay(4500);

            while (attempts < maxAttempts && !success) {
                try {
                    console.log(`🎙️ [Attempt ${attempts + 1}] Processing ${id}: "${wordStr}"...`);

                    const response = await ai.models.generateContent({
                        model: 'gemini-3.1-flash-tts-preview',
                        contents: wordStr,
                        config: {
                            responseModalities: ["AUDIO"],
                            speechConfig: {
                                voiceConfig: {
                                    prebuiltVoiceConfig: {
                                        voiceName: "Aoede" // Standard native accent suitable for language learners
                                    }
                                }
                            }
                        }
                    });

                    let base64Data = null;

                    // Extract base64 audio data from response
                    if (response.candidates && response.candidates.length > 0) {
                        const candidate = response.candidates[0];
                        if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
                            const part = candidate.content.parts[0];
                            if (part.inlineData && part.inlineData.data) {
                                base64Data = part.inlineData.data;
                            } else if (part.text) {
                                base64Data = part.text;
                            }
                        }
                    }

                    // Fallback for getting text
                    if (!base64Data && response.text) {
                        base64Data = typeof response.text === 'function' ? response.text() : response.text;
                    }

                    if (!base64Data) {
                        throw new Error("Could not extract audio data from the response.");
                    }

                    const rawBuffer = Buffer.from(base64Data, 'base64');
                    // Add standard WAV header to the raw 24kHz 16-bit Mono PCM
                    const headerBuffer = getWavHeader(rawBuffer.length, 24000);
                    const wavBuffer = Buffer.concat([headerBuffer, rawBuffer]);
                    
                    await fs.writeFile(filePath, wavBuffer);
                    successCount++;
                    success = true;

                } catch (err) {
                    // Gemini SDK error checking
                    const is429 = err.status === 429 || (err.message && err.message.includes('429'));
                    
                    if (is429) {
                        attempts++;
                        if (attempts >= maxAttempts) {
                            console.error(`❌ Max attempts reached for "${wordStr}". Skipping.`);
                            failCount++;
                            break;
                        }
                        const waitTime = Math.pow(2, attempts) * 1000;
                        console.warn(`⚠️ 429 Limit Hit for "${wordStr}". Retrying in ${waitTime/1000}s...`);
                        await delay(waitTime);
                    } else {
                        console.error(`❌ Non-429 Error for "${wordStr}":`, err.message);
                        failCount++;
                        break;
                    }
                }
            }
        }

        console.log(`\n--- Final Summary Report ---`);
        console.log(`Total words processed: ${words.length}`);
        console.log(`Successful: ${successCount}`);
        console.log(`Failed: ${failCount}`);
        console.log(`Audio files saved to: ${audioDir}`);

    } catch (error) {
        console.error("A fatal error occurred during the execution:", error);
    }
}

main();
