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
  if (!filename) return meta;

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
 * Parses ONE worksheet: finds the name column and the score column.
 * Returns: { students, errors }
 */
function parseSheet(ws, subjectName) {
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 1) return { students: [], errors: ["Empty sheet"] };

  // Find header row
  const headerRowIdx = rows.findIndex(row =>
    row && row.some(cell => {
      const norm = normalizeArabic(cell);
      return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
    })
  );

  if (headerRowIdx === -1) {
    return { students: [], errors: ["لم يتم العثور على عمود اسم الطالب"] };
  }

  const headerRow = rows[headerRowIdx];

  // Name column
  const nameCol = headerRow.findIndex(cell => {
    const norm = normalizeArabic(cell);
    return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
  });

  // Score column: match subject name first, otherwise first column after name
  // that is not a total/average/serial column
  const excluded = ["المجموع", "المعدل", "النسبه", "النتيجه", "ت", "م", "التسلسل"];
  let scoreCol = -1;

  if (subjectName) {
    const target = normalizeArabic(subjectName);
    scoreCol = headerRow.findIndex(cell => cell && normalizeArabic(cell) === target);
  }

  if (scoreCol === -1) {
    scoreCol = headerRow.findIndex((cell, idx) => {
      if (idx === nameCol || cell === null || cell === undefined) return false;
      const norm = normalizeArabic(cell);
      return norm !== "" && !excluded.includes(norm);
    });
  }

  if (scoreCol === -1) {
    return { students: [], errors: ["لم يتم العثور على عمود الدرجات"] };
  }

  const students = [];
  const errors = [];

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawName = row[nameCol];
    if (rawName === null || rawName === undefined || rawName.toString().trim() === "") continue;

    const name = rawName.toString().trim();
    const score = parseNumber(row[scoreCol]);

    if (score === null) {
      errors.push(`الصف ${i + 1}: درجة غير صالحة للطالب ${name}`);
      continue;
    }

    students.push({ name, score });
  }

  return { students, errors };
}

/**
 * Main entry: parses an Excel buffer (ONE subject per file).
 * options: { subjectName?, filename? }
 * Returns: { students, meta, errors }
 */
export function parseExcel(buffer, options = {}) {
  const { subjectName, filename } = options;

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return { students: [], meta: extractMetadataFromFilename(filename), errors: ["الملف لا يحتوي على أوراق"] };
    }

    const { students, errors } = parseSheet(workbook.Sheets[sheetName], subjectName);

    return {
      students,
      meta: extractMetadataFromFilename(filename),
      errors,
    };
  } catch (err) {
    return {
      students: [],
      meta: extractMetadataFromFilename(filename),
      errors: [`فشل قراءة الملف: ${err.message}`],
    };
  }
}

/**
 * Parses an Excel file where each column after the name is a subject.
 * Returns: { students: [{ name, subjects: [{ name, score }] }], subjectNames, meta, errors }
 */
export function parseExcelMulti(buffer, options = {}) {
  const { filename } = options;
  const meta = extractMetadataFromFilename(filename);

  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { students: [], subjectNames: [], meta, errors: ["الملف لا يحتوي على أوراق"] };
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: null });

    const isNameCell = (cell) => {
      const norm = normalizeArabic(cell);
      return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
    };

    const headerRowIdx = rows.findIndex(row => row && row.some(isNameCell));
    if (headerRowIdx === -1) {
      return { students: [], subjectNames: [], meta, errors: ["لم يتم العثور على عمود اسم الطالب"] };
    }

    const headerRow = rows[headerRowIdx];
    const nameCol = headerRow.findIndex(isNameCell);
    const excluded = ["المجموع", "المعدل", "النسبه", "النتيجه", "ت", "م", "التسلسل", "الرقم", "الترتيب"];

    const subjectCols = [];
    headerRow.forEach((cell, idx) => {
      if (idx === nameCol || cell === null || cell === undefined) return;
      const name = cell.toString().trim();
      if (!name || excluded.includes(normalizeArabic(name))) return;
      subjectCols.push({ name, idx });
    });

    if (subjectCols.length === 0) {
      return { students: [], subjectNames: [], meta, errors: ["لم يتم العثور على أعمدة المواد"] };
    }

    const students = [];
    const errors = [];

    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const rawName = row[nameCol];
      if (rawName === null || rawName === undefined || rawName.toString().trim() === "") continue;

      const name = rawName.toString().trim();
      const subjects = [];

      for (const col of subjectCols) {
        const raw = row[col.idx];
        if (raw === null || raw === undefined || raw.toString().trim() === "") continue;
        const score = parseNumber(raw);
        if (score === null) {
          errors.push(`الصف ${i + 1}: درجة غير صالحة في مادة ${col.name} للطالب ${name}`);
          continue;
        }
        subjects.push({ name: col.name, score });
      }

      students.push({ name, subjects });
    }

    return { students, subjectNames: subjectCols.map(c => c.name), meta, errors };
  } catch (err) {
    return { students: [], subjectNames: [], meta, errors: [`فشل قراءة الملف: ${err.message}`] };
  }
}
