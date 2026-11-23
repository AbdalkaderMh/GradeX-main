export function sortSubjects(subjects = []) {
  console.log("SORT WORKS", subjects.length);
  return [...subjects].sort((a, b) => rank(a) - rank(b));
}


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
    .replace(/[\u064B-\u0652\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ئ/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.replace(/^ال(?=.{2,})/, "").replace(/^ا(?=.{3,})/, ""))
    .join(" ");

const ORDER = SUBJECT_ORDER.map(normalize);

const getName = (s) => s?.name ?? s?.subjectName ?? s?.subject?.name ?? "";

function rank(subject) {
  const n = normalize(getName(subject));
  let i = ORDER.indexOf(n);
  if (i !== -1) return i;
  i = ORDER.findIndex((o) => n.startsWith(o + " "));
  if (i !== -1) return i;
  return ORDER.length;
}

export function sortSubjects(subjects = []) {
  return [...subjects].sort((a, b) => rank(a) - rank(b));
}
