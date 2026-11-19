import express from "express";
import multer from "multer";
import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import {
    uploadGrades,
    uploadPreview,
    confirmUpload,
    uploadPreviewAll,
    confirmUploadAll,
    bulkCreateStudents,
    bulkCreatePreview,
    bulkUpdatePublishStatus
} from "../controllers/gradeUploadController.js";
import {
    getStudents,
    updateStudent,
    deleteStudent,
    deleteSubjectFromStudent,
    exportStudents,
    getMyStudents
} from "../controllers/studentController.js";
import {
    getTeachers,
    createTeacher,
    getPendingTeachers,
    approveTeacher,
    getTeacherStats,
    deleteTeacher
} from "../controllers/teacherController.js";
import {
    getDropdownOptions,
    updateOptions,
    uploadLogo
} from "../controllers/settingsController.js";
import { getStats, getAuditLogs } from "../controllers/statsController.js";
import { protect, adminOnly, teacherOnly, staffOnly } from "../middleware/authMiddleware.js";
import {
    confirmUploadValidator,
    createTeacherValidator,
    updateStudentValidator
} from "../middleware/validators.js";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowed = [
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("نوع الملف غير مدعوم. يرجى رفع ملف Excel فقط."));
        }
    }
});

// Staff (Admin/Teacher) can upload ONE subject (teacher: only his own subject)
router.post("/upload", protect, staffOnly, upload.single("file"), uploadGrades);
router.post("/upload-preview", protect, staffOnly, upload.single("file"), uploadPreview);
router.post("/confirm-upload", protect, staffOnly, confirmUploadValidator, confirmUpload);

// Staff only
router.get("/my-students", protect, staffOnly, getMyStudents);

// Admin only
router.post("/upload-preview-all", protect, adminOnly, upload.single("file"), uploadPreviewAll);
router.post("/confirm-upload-all", protect, adminOnly, confirmUploadAll);
router.post("/bulk-create-preview", protect, adminOnly, upload.single("file"), bulkCreatePreview);
router.post("/bulk-create-students", protect, adminOnly, upload.single("file"), bulkCreateStudents);
router.get("/students", protect, adminOnly, getStudents);
router.put("/students/:id", protect, adminOnly, updateStudentValidator, updateStudent);
router.delete("/students/:id", protect, adminOnly, deleteStudent);
router.get("/options", protect, getDropdownOptions);
router.put("/options", protect, adminOnly, updateOptions);
router.post("/upload-logo", protect, adminOnly, upload.single("logo"), uploadLogo);
router.put("/approve-teacher/:teacherId", protect, adminOnly, approveTeacher);
router.get("/stats", protect, adminOnly, getStats);
router.get("/teacher-stats", protect, teacherOnly, getTeacherStats);
router.get("/teachers", protect, adminOnly, getTeachers);
router.post("/teachers", protect, adminOnly, createTeacherValidator, createTeacher);
router.delete("/teachers/:id", protect, adminOnly, deleteTeacher);
router.get("/pending-teachers", protect, adminOnly, getPendingTeachers);
router.get("/export-students", protect, adminOnly, exportStudents);
router.post("/bulk-publish", protect, adminOnly, bulkUpdatePublishStatus);
router.delete("/students/:id/subjects/:subjectName", protect, adminOnly, deleteSubjectFromStudent);
router.get("/audit-logs", protect, adminOnly, getAuditLogs);

// Export teachers with their subjects (data is turned into Excel in the frontend)
router.get("/export-teachers", protect, adminOnly, async (req, res) => {
  try {
    const teachers = await Teacher.find()
      .populate("userId", "name username status")
      .lean();

    const rows = teachers
      .filter((t) => t.userId) // skip teacher records whose account was deleted
      .map((t) => ({
        name: t.userId.name,
        username: t.userId.username,
        subjects: (t.subjects || []).join("، "),
        status: t.userId.status === "approved" ? "مفعّل" : "بانتظار الموافقة",
      }));

    res.json({ success: true, teachers: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
  }
});

// Start a new academic year: delete all students and their accounts
router.post("/new-year", protect, adminOnly, async (req, res) => {
  try {
    if (req.body.confirm !== "حذف") {
      return res.status(400).json({ success: false, message: "لم يتم التأكيد" });
    }

    const studentUsers = await User.find({ role: "student" }).select("_id").lean();
    const ids = studentUsers.map((u) => u._id);

    const studentsResult = await Student.deleteMany({ userId: { $in: ids } });
    const orphansResult = await Student.deleteMany({
      userId: { $nin: (await User.find({}).select("_id").lean()).map((u) => u._id) },
    });
    const usersResult = await User.deleteMany({ role: "student" });

    res.json({
      success: true,
      deletedUsers: usersResult.deletedCount,
      deletedStudents: studentsResult.deletedCount + orphansResult.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
  }
});

export default router;
