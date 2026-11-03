import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Settings from "../models/Settings.js";
import { parseExcel, parseExcelMulti } from "../utils/excelParser.js"; // NEW: parseExcelMulti
import { generateUsername } from "../utils/idGenerator.js";
import { normalizeArabic } from "../utils/textUtils.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/Auditlog.js";

const getSettings = async () => {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error("Settings not found. Please initialize the system.");
    }
    return settings;
  };

/**
 * UPLOAD PREVIEW (No save)
 */
export const uploadPreview = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { subjectName, grade, department } = req.body;

    // Strict Teacher Authorization
    if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.subjects.includes(subjectName)) {
            return res.status(403).json({ message: "غير مخول لمعاينة درجات هذه المادة" });
        }
    }
    const { students, errors } = parseExcel(req.file.buffer, { subjectName });

    const filename = req.file.originalname;
    let inferredGrade = grade;
    let inferredDept = department;

    const settings = await getSettings();

    if (!inferredGrade) {
        for (const g of settings.grades) {
            if (filename.includes(g)) { inferredGrade = g; break; }
        }
    }
    if (!inferredDept) {
        for (const d of settings.departments) {
            if (filename.includes(d)) { inferredDept = d; break; }
        }
    }

    const enrichedStudents = await Promise.all(students.map(async (s) => {
        const norm = normalizeArabic(s.name);
        const user = await User.findOne({
            $or: [{ name: s.name }, { normalizedName: norm }],
            role: "student"
        });
        return {
            ...s,
            username: user ? user.username : "غير مسجل",
            studentKey: user ? "[محفوظ]" : "---",
            exists: !!user,
            subjects: [{ name: subjectName || "General", grade: s.score }]
        };
    }));

    res.json({
      success: true,
      students: enrichedStudents,
      meta: {
        grade: inferredGrade || (settings.grades.length ? settings.grades[0] : ""),
        department: inferredDept || (settings.departments.length ? settings.departments[0] : ""),
        academicYear: settings.academicYear,
        section: req.body.section || "أ"
      },
      summary: {
        total: students.length,
        subjectName: subjectName || "General"
      },
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CONFIRM UPLOAD (Save to DB)
 */
export const confirmUpload = async (req, res) => {
  try {
    const { students, isPublished, subjectName, autoCreate, grade, department, section } = req.body;
    const activeSubject = subjectName || "General";

    // Strict Teacher Authorization
    if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.subjects.includes(activeSubject)) {
            return res.status(403).json({ message: "غير مخول لنشر درجات هذه المادة" });
        }
    }

    let saved = 0;
    let skipped = 0;
    let createdCount = 0;
    const finalStudents = [];

    // Batch pre-fetch all
