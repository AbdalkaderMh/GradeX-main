// الترتيب المطلوب للمواد في الشهادة
const SUBJECT_ORDER = [
  "التربية الإسلامية",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "تطبيقات",
  "اتصالات",
  "اساسيات",
  "مبادئ",
];

// توحيد شكل الاسم قبل المقارنة
const normalize = (s = "") =>
  s
    .replace(/[\u064B-\u0652\u0640]/g, "") // التشكيل والتطويل
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();

const ORDER = SUBJECT_ORDER.map(normalize);

export function sortSubjects(subjects = []) {
  const rank = (name) => {
    const i = ORDER.indexOf(normalize(name));
    return i === -1 ? ORDER.length : i; // أي مادة غير مذكورة تأتي في النهاية
  };
  return [...subjects].sort((a, b) => rank(a.name) - rank(b.name));
}
