import express from "express";


// ── Emergency Admin Password Reset ─────────────────────────────
export const emergencyResetAdmin = async (req, res) => {
  try {
    const { setupKey, newPassword } = req.body;

    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ message: "Invalid setup key" });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const admin = await User.findOne({ role: "admin" });
    if (!admin) {
      return res.status(404).json({ message: "Admin account not found" });
    }

    admin.password = newPassword;
    admin.requiresPasswordChange = false;
    admin.loginAttempts = 0;
    admin.lockUntil = undefined;
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();

    res.json({ success: true, message: "Admin password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
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
