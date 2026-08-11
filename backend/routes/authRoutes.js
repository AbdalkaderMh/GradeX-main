import express from "express";
import {
  login,
  teacherSignup,
  getProfile,
  updateProfile,
  uploadAvatar,
  ensureAdminExists,
  getPublicSettings,
  generateResetToken,
  resetPassword,
} from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import multer from "multer";

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("يرجى رفع ملفات الصور فقط."));
        }
    }
});

router.get("/settings", getPublicSettings);
router.post("/login", login);
router.post("/signup/teacher", teacherSignup);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);
router.post("/setup/admin", ensureAdminExists);
router.post("/generate-reset-token/:userId", protect, adminOnly, generateResetToken);
router.post("/reset-password", resetPassword);

export default router;
