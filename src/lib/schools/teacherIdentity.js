/**
 * Öğretmen masası — gizlilik öncelikli kimlik yardımcıları.
 * Gerçek ad / okul / konum zorunlu değil; rumuz + avatar yeterli.
 */

export const TEACHER_AVATAR_PRESETS = [
  { id: "owl", emoji: "🦉", label: "Baykuş" },
  { id: "book", emoji: "📚", label: "Kitap" },
  { id: "star", emoji: "⭐", label: "Yıldız" },
  { id: "fox", emoji: "🦊", label: "Tilki" },
  { id: "rocket", emoji: "🚀", label: "Roket" },
  { id: "leaf", emoji: "🌿", label: "Yaprak" },
];

export const STUDENT_AVATAR_PRESETS = [
  { id: "lion", emoji: "🦁", label: "Aslan" },
  { id: "fox", emoji: "🦊", label: "Tilki" },
  { id: "panda", emoji: "🐼", label: "Panda" },
  { id: "rocket", emoji: "🚀", label: "Roket" },
  { id: "star", emoji: "🌟", label: "Yıldız" },
  { id: "unicorn", emoji: "🦄", label: "Tekboynuz" },
  { id: "dragon", emoji: "🐉", label: "Ejderha" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "owl", emoji: "🦉", label: "Baykuş" },
  { id: "dolphin", emoji: "🐬", label: "Yunus" },
  { id: "tiger", emoji: "🐯", label: "Kaplan" },
  { id: "butterfly", emoji: "🦋", label: "Kelebek" },
];

export const DEFAULT_SCHOOL_LABEL = "Özel masa";

/**
 * Sınıfta görünecek öğretmen etiketi.
 * Google/Apple gerçek adını varsayılan zorlamaz.
 */
export function suggestTeacherDisplayLabel(profile) {
  const username = String(profile?.username || "").trim();
  if (username) return username.slice(0, 40);
  return "";
}

export function resolveTeacherAvatar(presetId, profilePhotoUrl) {
  if (presetId === "photo" && profilePhotoUrl) {
    return { type: "url", value: String(profilePhotoUrl).slice(0, 500) };
  }
  const preset =
    TEACHER_AVATAR_PRESETS.find((p) => p.id === presetId) || TEACHER_AVATAR_PRESETS[0];
  return { type: "emoji", value: preset.emoji };
}

export function formatSchoolLine(classroom) {
  if (!classroom) return "";
  const school = String(classroom.schoolName || "").trim();
  const isGeneric = !school || school === DEFAULT_SCHOOL_LABEL || school === "Okul";
  const loc =
    classroom.district && classroom.province
      ? `${classroom.district} / ${classroom.province}`
      : classroom.province || "";
  if (isGeneric && !loc) return "Ev / özel masa";
  if (isGeneric) return loc;
  return loc ? `${school} · ${loc}` : school;
}

/**
 * Zalgo, görünmez kontrol karakterleri ve HTML/script etiketlerini temizler.
 */
export function sanitizeDisplayLabel(raw, maxLen = 40) {
  return String(raw || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[<>{}[\]\\/$`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

