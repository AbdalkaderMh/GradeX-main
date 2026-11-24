const KEYS = [
  "اسلام",   // التربية الإسلامية
  "عرب",     // اللغة العربية
  "نجليز",   // اللغة الإنجليزية
  "رياض",    // الرياضيات
  "تطبيق",   // تطبيقات
  "اتصال",   // الاتصالات
  "اساس",    // الاساسيات
  "مبادي",   // المبادئ
];

const clean = (s = "") =>
  String(s)
    .replace(/[\u064B-\u0652\u0640\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىئی]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ک/g, "ك");

const getName = (s) =>
  typeof s === "string"
    ? s
    : s?.name ?? s?.subjectName ?? s?.subject?.name ?? s?.title ?? "";

function rank(subject) {
  const n = clean(getName(subject));
  const i = KEYS.findIndex((k) => n.includes(k));
  return i === -1 ? KEYS.length : i;
}

export function sortSubjects(subjects = []) {

  return [...subjects].sort((a, b) => rank(a) - rank(b));
}
