// الترتيب المطلوب للمواد في الشهادة
// اكتب الاسم بأي صيغة (مثل: اتصالات أو الاتصالات)، فالمطابقة تتجاهل "ال" والهمزات والتاء المربوطة
const SUBJECT_ORDER = [
  "التربية الإسلامية",
  "اللغة العربية",
  "اللغة الإنجليزية",
  "الرياضيات",
  "تطبيقات",
  "الاتصالات",
  "الاساسيات",
  "المبادئ",
];

// توحيد شكل الاسم قبل المقارنة
const normalize = (s = "") =>
  String(s)
    .replace(/[\u064B-\u0652\u0640]/g, "")   // التشكيل والتطويل
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => (w.length > 3 && w.startsWith("ال") ? w.slice(2) : w)) // حذف "ال" من أول كل كلمة
    .join(" ");

const ORDER = SUBJECT_ORDER.map(normalize);

function rank(name) {
  const n = normalize(name);

  // 1) تطابق كامل (الاتصالات = اتصالات)
  let i = ORDER.indexOf(n);
  if (i !== -1) return i;

  // 2) المادة تبدأ باسم من القائمة (مثل: "تطبيقات الحاسوب" ← تطبيقات)
  i = ORDER.findIndex((o) => n.startsWith(o + " "));
  if (i !== -1) return i;

  return ORDER.length; // غير مذكورة: تأتي في النهاية
}

export function sortSubjects(subjects = []) {
  return [...subjects].sort((a, b) => rank(a.name) - rank(b.name));
}
