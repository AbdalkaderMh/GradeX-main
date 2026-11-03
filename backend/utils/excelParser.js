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
