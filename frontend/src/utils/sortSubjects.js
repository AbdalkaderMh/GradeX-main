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

const normalize = (s = "") =>
  String(s)
    .replace(/[\u064B-\u0652\u0640\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىئی]/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ک/g, "ك")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.replace(/^ال(?=.{2,})/, "").replace(/^ا(?=.{3,})/, ""))
    .join(" ");

const ORDER = SUBJECT_ORDER.map(normalize);

const getName = (s) =>
  typeof s === "string"
    ? s
    : s?.name ?? s?.subjectName ?? s?.subject?.name ?? s?.title ?? "";


function rank(subject) {
  const n = normalize(getName(subject));
  const i = ORDER.findIndex((o) => ` ${n} `.includes(` ${o} `));
  return i === -1 ? ORDER.length : i;
}

export function sortSubjects(subjects = []) {

  return [...subjects].sort((a, b) => rank(a) - rank(b));
}
