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
    if (typeof str !== 'string') return str;
    return str.replace(/[٠١٢٣٤٥٦٧٨٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d));
}

/**
 * MAIN PARSER - SINGLE SUBJECT FOCUS
 *
 * Expectations:
 * - Each file contains only one subject.
 * - Format: Student Name | Grade (or similar)
 */
/**
 * Utility to extract metadata from Arabic filename or spreadsheet headers
 */
function extractMetadataFromFilename(filename) {
    const meta = { grade: "", department: "", section: "" };

    // Arabic keyword mapping
    const grades = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];
    const departments = {
        "تجميع": "تجميع وصيانة الحاسوب",
        "الأمن": "الأمن السيبراني",
        "الكهرباء": "هندسة الكهرباء",
        "الميكانيك": "هندسة الميكانيك",
        "اللحام": "اللحام"
    };
    const sections = ["أ", "ب", "ج", "د"];

    for (const g of grades) { if (filename.includes(g)) meta.grade = g; }
    for (const [key, val] of Object.entries(departments)) { if (filename.includes(key)) meta.department = val; }
    for (const s of sections) { if (filename.includes(`(${s})`) || filename.includes(` ${s} `)) meta.section = s; }

    return meta;
}

export function parseExcel(buffer, { subjectName, filename = "" }) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 1) return { students: [], errors: ["Empty file"] };

  const meta = extractMetadataFromFilename(filename);

  // Identify name column and grade column
  // Searching for the row that looks most like a header row
  let headerRowIdx = rows.findIndex(row =>
    row && row.some(cell => {
        const norm = normalizeArabic(cell);
        return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
    })
  );

  // Fallback if strict match fails
  if (headerRowIdx === -1) {
      headerRowIdx = rows.findIndex(row =>
        row && row.some(cell => {
            const norm = normalizeArabic(cell);
            return norm.includes("اسم") || norm.includes("الاسم");
        })
      );
  }

  if (headerRowIdx === -1) {
    return { students: [], errors: ["Could not find header row with 'Student Name'"] };
  }

  const headers = rows[headerRowIdx];
  let nameIdx = headers.findIndex(h => {
      const norm = normalizeArabic(h);
      return norm.includes("اسم") || norm.includes("الاسم");
  });

  // Fallback: If no "Name" header found, look for the first column that contains strings longer than 5 chars
  if (nameIdx === -1) {
      for (let i = headerRowIdx + 1; i < Math.min(rows.length, headerRowIdx + 10); i++) {
          const firstStringCol = rows[i]?.findIndex(cell => cell && typeof cell === 'string' && cell.length > 5);
          if (firstStringCol !== -1) {
              nameIdx = firstStringCol;
              break;
          }
      }
  }

  // Final fallback: use Column 0
  if (nameIdx === -1) nameIdx = 0;

  // SMART GRADE DETECTION: Find the "Total" column
  // Often there are multiple columns with grades, we want the "Final Total" (المجموع)
  // We search from right to left as "Total" is usually at the end.
  let gradeIdx = -1;
  const gradeKeywords = ["مجموع", "المجموع", "درجه", "النتيجه", "النهائي"];

  for (let j = headers.length - 1; j >= 0; j--) {
      if (j === nameIdx || !headers[j]) continue;
      const norm = normalizeArabic(headers[j]);
      if (gradeKeywords.some(kw => norm.includes(kw))) {
          gradeIdx = j;
          break;
      }
  }

  const students = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawName = row[nameIdx];
    if (!rawName) continue;

    const studentName = String(rawName).trim();
    const normName = normalizeArabic(studentName);

    // Skip numbers or very short entries
    if (!studentName || studentName.length < 3 || !isNaN(studentName)) continue;

    // ADMINISTRATIVE ROW FILTER: Skip titles, metadata, and repeating headers
    const skipKeywords = [
        "اسماء طلاب", "اسم الطالب", "العام الدراسي", "شعبه",
        "تجميع", "صيانه", "الحاسوب", "الرابع", "المجموع", "ت", "شهر"
    ];

    if (skipKeywords.some(kw => normName.includes(kw))) {
        // Strict and smart filtering for administrative/metadata rows
        const isHeaderExact = normName === "اسم الطالب" || normName === "المجموع" || normName === "ت";
        const isTitleRow = studentName.includes("قسم") || studentName.includes("طلاب") || studentName.includes("العام الدراسي");
        const isMetadataFragment = normName === "تجميع" || normName === "شعبه" || normName === "شهر";

        if (isHeaderExact || isTitleRow || isMetadataFragment) {
            continue;
        }
    }

    let score = 0;
    if (gradeIdx !== -1) {
        let val = row[gradeIdx];
        if (val !== null && val !== undefined) {
            val = convertArabicNumerals(val.toString());
            score = parseFloat(val) || 0;
        }
    }

    students.push({
      name: studentName,
      score,
      details: {}
    });
  }

  return {
    students,
    meta,
    subjectName: subjectName || "General",
    errors: gradeIdx === -1 ? ["Could not find Grade column (المجموع). Only names extracted."] : []
  };
}
