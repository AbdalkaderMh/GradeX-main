import express from "express";
import multer from "multer";
import {
    uploadGrades,
    uploadPreview,
    confirmUpload,
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
    getTeacherStats
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

// Staff (Admin/Teacher) can upload
router.post("/upload", protect, staffOnly, upload.single("file"), uploadGrades);
router.post("/upload-preview", protect, staffOnly, upload.single("file"), uploadPreview);
router.post("/confirm-upload", protect, staffOnly, confirmUploadValidator, confirmUpload);

// Staff only
router.get("/my-students", protect, staffOnly, getMyStudents);

// Admin only
router.post("/bulk-create-preview", protect, adminOnly, upload.single("file"), bulkCreatePreview);
router.post("/bulk-create-students", protect, adminOnly, upload.single("file"), bulkCreateStudents);
router.get("/students", protect, adminOnly, getStudents);
router.put("/students/:id", protect, adminOnly, updateStudentValidator, updateStudent);
router.delete("/students/:id", protect, adminOnly, deleteStudent);
router.get("/options", protect, staffOnly, getDropdownOptions);
router.put("/options", protect, adminOnly, updateOptions);
router.post("/upload-logo", protect, adminOnly, upload.single("logo"), uploadLogo);
router.put("/approve-teacher/:teacherId", protect, adminOnly, approveTeacher);
router.get("/stats", protect, adminOnly, getStats);
router.get("/teacher-stats", protect, teacherOnly, getTeacherStats);
router.get("/teachers", protect, adminOnly, getTeachers);
router.post("/teachers", protect, adminOnly, createTeacherValidator, createTeacher);
router.get("/pending-teachers", protect, adminOnly, getPendingTeachers);
router.get("/export-students", protect, adminOnly, exportStudents);
router.post("/bulk-publish", protect, adminOnly, bulkUpdatePublishStatus);
router.delete("/students/:id/subjects/:subjectName", protect, adminOnly, deleteSubjectFromStudent);
router.get("/audit-logs", protect, adminOnly, getAuditLogs);

export default router;
