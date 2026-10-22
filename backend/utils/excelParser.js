import XLSX from "xlsx";

/**
 * Normalizes Arabic text (minimal normalization for matching)
 */
function normalizeArabic(text) {
  if (!text) return "";
  return text
    .toString()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .trim();
}

/**
 * Converts Eastern Arabic Numerals (٠-٩) to standard numerals (0-9)
 */
function convertArabicNumerals(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

/**
 * Parses a cell into a number, or returns null if it is not numeric
 */
function parseNumber(val) {
  if (val === null || val === undefined || val === "") return null;
  const n = parseFloat(convertArabicNumerals(val.toString()).trim());
  return isNaN(n) ? null : n;
}

/**
 * Utility to extract metadata from Arabic filename
 */
function extractMetadataFromFilename(filename) {
  const meta = { grade: "", department: "", section: "" };

  const grades = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
  const departments = {
    "تجميع": "تجميع وصيانة الحاسوب",
    "الأمن": "الأمن السيبراني",
    "الكهرباء": "هندسة الكهرباء",
    "الميكانيك": "هندسة الميكانيك",
    "اللحام": "اللحام",
  };
  const sections = ["أ", "ب", "ج", "د"];

  for (const g of grades) { if (filename.includes(g)) meta.grade = g; }
  for (const [key, val] of Object.entries(departments)) { if (filename.includes(key)) meta.department = val; }
  for (const s of sections) { if (filename.includes(`(${s})`) || filename.includes(` ${s} `)) meta.section = s; }

  return meta;
}

/**
 * Parses ONE worksheet (one subject) with multiple grade columns per student.
 * Returns: { students, gradeColumns, errors }
 */
function parseSheet(ws) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 1) return { students: [], gradeColumns: [], errors: ["Empty sheet"] };

  // Find header row
  let headerRowIdx = rows.findIndex(row =>
    row && row.some(cell => {
      const norm = normalizeArabic(cell);
      return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
    })
  );

  if
