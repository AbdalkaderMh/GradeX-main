// backend/utils/sortSubjects.js

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
    .replace(/[\u064B-\u0652\u0640]/g, "") // التشكيل والتطويل
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) =>
      w
        .replace(/^ال(?=.{2,})/, "") // حذف "ال" من أول الكلمة
        .replace(/^ا(?=.{3,})/, "")  // توحيد الكلمات التي تبدأ بألف (اتصالات = الاتصالات)
    )
    .join(" ");

const ORDER = SUBJECT_ORDER.map(normalize);

// يدعم أكثر من اسم للحقل حسب شكل البيانات القادمة
const getName = (s) => s?.name ?? s?.subjectName ?? s?.subject?.name ?? "";

function rank(subject) {
  const n = normalize(getName(subject));

  // 1) تطابق كامل
  let i = ORDER.indexOf(n);
  if (i !== -1) return i;

  // 2) المادة تبدأ باسم من القائمة (مثل: "تطبيقات الحاسوب" ← تطبيقات)
  i = ORDER.findIndex((o) => n.startsWith(o + " "));
  if (i !== -1) return i;

  return ORDER.length; // غير مذكورة: تأتي في النهاية
}

function sortSubjects(subjects = []) {
  return [...subjects].sort((a, b) => rank(a) - rank(b));
}

module.exports = { sortSubjects };
