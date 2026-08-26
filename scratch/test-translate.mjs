import { initializeApp } from "firebase/app";
import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from "firebase/ai";

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "memolandum.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "memolandum-33dc4",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:539033091302:web:1e4c4763aff1da0c2bcf27",
});

const ai = getAI(app, { backend: new GoogleAIBackend() });

const responseSchema = Schema.object({
  properties: {
    sourceLang: Schema.string(),
    translation: Schema.string(),
    transcript: Schema.string(),
  },
  optionalProperties: ["sourceLang", "transcript"],
});

const model = getGenerativeModel(ai, {
  model: "gemini-flash-latest",
  generationConfig: {
    temperature: 0.2,
    maxOutputTokens: 512,
    responseMimeType: "application/json",
    responseSchema,
  },
});

const prompt = `You are Memolandum's instant translator for language learners.
Translate the user's text into English (en).
Detect the source language.
Return ONLY valid JSON matching the schema.
Keep proper nouns when appropriate. Be concise and natural.
User text:
"""bunun fiyatını öğrenebilir miyim?"""`;

try {
  const result = await model.generateContent(prompt);
  let raw = "";
  try {
    raw = result.response.text();
  } catch (e) {
    console.log("text() threw", e.message);
  }
  console.log("RAW:", JSON.stringify(raw));
  console.log("candidates:", JSON.stringify(result.response.candidates, null, 2)?.slice(0, 2000));
  console.log("promptFeedback:", JSON.stringify(result.response.promptFeedback, null, 2));
} catch (e) {
  console.error("FAIL", e?.message || e);
  console.error("code", e?.code);
  console.error("custom", e?.customData || e?.details);
}
