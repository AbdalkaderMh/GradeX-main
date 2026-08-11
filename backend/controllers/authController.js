import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Settings from "../models/Settings.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { generateUsername } from "../utils/idGenerator.js";
import { processImage, deleteOldImage } from "../utils/imageHandler.js";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 60 * 1000;

// ── Ensure Admin Exists ───────────────────────────────────────
export const ensureAdminExists = async () => {
  try {
    const existingAdmin = await User.findOne({ role: "admin" });

    if (existingAdmin) {
      console.log("✅ Admin already exists");
      return;
    }

    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    const admin = await User.create({
      name: "System Admin",
      username: "admin",
      password: adminPassword,
      role: "admin",
      status: "approved",
      requiresPasswordChange: true,
    });

    console.log("🔥 Initial admin created!");
    console.log("👤 Username: admin");
    console.log(`🔑 Password: ${adminPassword}`);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
};

// ── LOGIN ─────────────────────────────────────────────────────
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isLocked)
      return res
        .status(401)
        .json({ message: "Account is locked. Try again later." });

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
      }
      await user.save();
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.status !== "approved")
      return res.status(403).json({ message: "Account pending approval" });

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        version: user.tokenVersion || 0,
        roleVersion: user.roleVersion || 0,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      role: user.role,
      requiresPasswordChange: user.requiresPasswordChange,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ── Teacher Signup ────────────────────────────────────────────
export const teacherSignup = async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password)
      return res.status(400).json({ message: "Name and password required" });

    if (password.length < 8)
      return res.status(400).json({
        message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      });

    const username = await generateUsername("teacher");

    const user = await User.create({
      name,
      username,
      password,
      role: "teacher",
      status: "pending",
      requiresPasswordChange: true,
    });

    await Teacher.create({ userId: user._id, subjects: [] });

    res.status(201).json({
      message: "تم تسجيل المعلم بنجاح. يرجى انتظار موافقة الإدارة.",
      username: user.username,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Update Profile ────────────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const { name, password } = req.body;
    const user = await User.findById(req.user.id);

    if (password && password.length < 8)
      return res.status(400).json({
        message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
      });

    if (name) {
      if (user.role !== "admin")
        return res
          .status(403)
          .json({ message: "فقط المسؤول يمكنه تغيير الاسم" });

      user.name = name;
    }

    if (password) {
      user.password = password;
      user.requiresPasswordChange = false;
      user.tokenVersion = (user.tokenVersion || 0) + 1;
    }

    await user.save();

    res.json({ success: true, message: "تم تحديث الملف الشخصي بنجاح" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Upload Avatar ─────────────────────────────────────────────
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const avatarPath = await processImage(req.file.buffer, "avatar");

    if (user.avatar) deleteOldImage(user.avatar);

    user.avatar = avatarPath;
    await user.save();

    res.json({ success: true, avatar: avatarPath });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get Profile ───────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    let profileData = { user };

    if (user.role === "student")
      profileData.profile = await Student.findOne({ userId: user._id });
    else if (user.role === "teacher")
      profileData.profile = await Teacher.findOne({ userId: user._id });

    res.json(profileData);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ── Public Settings ───────────────────────────────────────────
export const getPublicSettings = async (req, res) => {
  try {
    const settings = await Settings.findOne();

    if (!settings) {
      return res.json({
        schoolName: "GradeX",
        logo: "/logo.png",
        developerName: "عبدالقادر محمد",
      });
    }

    res.json({
      schoolName: settings.schoolName,
      logo: settings.logo,
      developerName: settings.developerName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Secure Reset Token ────────────────────────────────────────
export const generateResetToken = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = randomBytes(32).toString("hex");

    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000;

    await user.save();

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Reset Password ────────────────────────────────────────────
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword)
      return res.status(400).json({
        message: "Token and new password required",
      });

    if (newPassword.length < 8)
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({
        message: "Invalid or expired token",
      });

    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.requiresPasswordChange = false;
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
