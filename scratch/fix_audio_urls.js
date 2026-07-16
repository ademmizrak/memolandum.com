const fs = require('fs');
const path = require('path');

const dataDir = path.join('d:/000Memorade/public/data');
const languages = ['Almanca', 'Fransizca', 'Greek', 'Italyanca', 'Kore', 'Russian', 'Spanish'];

function findMp3(dir, id, wordStr) {
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    
    // 1. Check exact ID match: de_sent_001.mp3
    let match = files.find(f => f.toLowerCase() === `${id.toLowerCase()}.mp3`);
    if (match) return match;
    
    // 2. Check ID + word match: a1_de_tr_01_zeit.mp3
    const safeWord = wordStr.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    match = files.find(f => f.toLowerCase() === `${id.toLowerCase()}_${safeWord}.mp3`);
    if (match) return match;

    // 3. Check word match with accents preserved: baño.mp3, a_qué_hora_cierran.mp3
    let wordAccents = wordStr.toLowerCase().replace(/[¿?¡!.,]/g, '').trim().replace(/\s+/g, '_');
    match = files.find(f => f.toLowerCase() === `${wordAccents}.mp3`);
    if (match) return match;

    // 4. Check word match without accents
    match = files.find(f => f.toLowerCase() === `${safeWord}.mp3`);
    if (match) return match;

    // 5. Starts with ID
    match = files.find(f => f.toLowerCase().startsWith(`${id.toLowerCase()}_`));
    if (match) return match;

    return null;
}

let totalMissing = 0;
let totalFound = 0;
let updatedFiles = 0;

languages.forEach(lang => {
    const langDir = path.join(dataDir, lang);
    if (!fs.existsSync(langDir)) return;

    function walk(dir, fileList = []) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (file === 'Audio' || file === 'Audio_lib') continue;
            const filePath = path.join(dir, file);
            if (fs.statSync(filePath).isDirectory()) {
                walk(filePath, fileList);
            } else if (filePath.endsWith('.json')) {
                fileList.push(filePath);
            }
        }
        return fileList;
    }

    const jsonFiles = walk(langDir);
    
    let langCode = 'en';
    if (lang === 'Almanca') langCode = 'de';
    if (lang === 'Fransizca') langCode = 'fr';
    if (lang === 'Greek') langCode = 'el';
    if (lang === 'Italyanca') langCode = 'it';
    if (lang === 'Kore') langCode = 'ko';
    if (lang === 'Russian') langCode = 'ru';
    if (lang === 'Spanish') langCode = 'es';

    const audioSentencesDir = path.join(langDir, 'Audio_lib', `audio_sentences_${langCode}`);
    const audioWordsDir = path.join(langDir, 'Audio_lib', `audio_words_${langCode}`);

    for (const jsonFile of jsonFiles) {
        try {
            const content = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
            let arr = [];
            let container = null;
            if (Array.isArray(content)) { arr = content; }
            else if (content.words) { arr = content.words; container = 'words'; }
            else if (content.phrase_vault) { arr = content.phrase_vault; container = 'phrase_vault'; }
            else if (content.vocabulary_vault) { arr = content.vocabulary_vault; container = 'vocabulary_vault'; }
            else { 
                // Don't mess with object structures if they aren't arrays
                continue; 
            }

            let isSentence = jsonFile.toLowerCase().includes('cumle') || jsonFile.toLowerCase().includes('sentence') || jsonFile.toLowerCase().includes('phrases');
            let audioDir = isSentence ? audioSentencesDir : audioWordsDir;
            
            let changed = false;

            arr.forEach(w => {
                if (typeof w !== 'object' || !w.id) return;
                const wordStr = w.english || w.word || w.en || '';
                if (!wordStr) return;

                const mp3Name = findMp3(audioDir, w.id, wordStr);
                if (mp3Name) {
                    const url = `/data/${lang}/Audio_lib/${isSentence ? `audio_sentences_${langCode}` : `audio_words_${langCode}`}/${mp3Name}`;
                    if (w.audioUrl !== url) {
                        w.audioUrl = url;
                        changed = true;
                    }
                    totalFound++;
                } else {
                    totalMissing++;
                }
            });

            if (changed) {
                fs.writeFileSync(jsonFile, JSON.stringify(content, null, 2));
                updatedFiles++;
            }

        } catch(e) {
            console.error('Error with', jsonFile, e.message);
        }
    }
});

console.log(`Total Found: ${totalFound}, Total Missing: ${totalMissing}, Updated Files: ${updatedFiles}`);
