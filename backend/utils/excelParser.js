import * as XLSX from 'xlsx';

// دالة لتطبيع وتوحيد النصوص العربية
function normalizeArabic(text) {
  if (!text) return "";
  return String(text)
    .trim()
    .replace(/[أإآء]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase();
}

// دالة لتحويل الأرقام الهندية/العربية المشرقية إلى أرقام إنجليزية
function convertArabicNumerals(str) {
  if (typeof str !== 'string') return str;
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianNumbers = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[٠-٩۰-۹]/g, d => {
    let index = arabicNumbers.indexOf(d);
    if (index === -1) index = persianNumbers.indexOf(d);
    return index;
  });
}

// دالة استخراج البيانات الوصفية من اسم الملف
function extractMetadataFromFilename(filename) {
  return {
    grade: "",
    department: "",
    section: "",
    round: "الأول",
    subject: ""
  };
}

export function parseExcel(buffer, { filename = "" }) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const ws = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  if (rows.length < 1) return { students: [], errors: ["Empty file"] };

  const meta = extractMetadataFromFilename(filename);

  // العثور على صف العناوين الذي يحتوي على اسم الطالب
  let headerRowIdx = rows.findIndex(row =>
    row && row.some(cell => {
        const norm = normalizeArabic(cell);
        return norm === "اسم الطالب" || norm === "الاسم" || (norm.includes("اسم") && norm.includes("طالب"));
    })
  );

  if (headerRowIdx === -1) {
    return { students: [], errors: ["Could not find header row with 'Student Name'"] };
  }

  const headers = rows[headerRowIdx];
  let nameIdx = headers.findIndex(h => {
      const norm = normalizeArabic(h);
      return norm.includes("اسم") || norm.includes("الاسم");
  });

  if (nameIdx === -1) nameIdx = 0;

  // تحديد أعمدة المواد الدراسية مع استبعاد البيانات الوصفية والـ General
  const excludeKeywords = [
    "ت", "الاسم", "اسم الطالب", "المجموع", "مجموع", "النتيجه", "ملاحظات", "الترتيب",
    "general", "department", "grade", "section", "specialty", "round"
  ];
  
  const subjectColumns = [];

  headers.forEach((h, index) => {
      if (index === nameIdx || !h) return;
      const norm = normalizeArabic(h);
      const isExcluded = excludeKeywords.some(kw => norm === kw || norm.includes(kw));
      
      if (!isExcluded) {
          subjectColumns.push({ index, name: String(h).trim() });
      }
  });

  const students = [];
  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;

    const rawName = row[nameIdx];
    if (!rawName) continue;

    const studentName = String(rawName).trim();
    if (!studentName || studentName.length < 3 || !isNaN(studentName)) continue;

    // استخراج درجات المواد المتعددة لهذا الطالب
    const subjects = [];
    let calculatedTotal = 0;

    subjectColumns.forEach(sub => {
        let val = row[sub.index];
        let score = 0;
        if (val !== null && val !== undefined) {
            val = convertArabicNumerals(val.toString());
            score = parseFloat(val) || 0;
        }
        subjects.push({
            name: sub.name,
            currentScore: score
        });
        calculatedTotal += score;
    });

    students.push({
      name: studentName,
      subjects,
      total: calculatedTotal,
      details: {}
    });
  }

  return {
    students,
    meta,
    errors: subjectColumns.length === 0 ? ["لم يتم العثور على أعمدة مواد دراسية في الملف."] : []
  };
}
