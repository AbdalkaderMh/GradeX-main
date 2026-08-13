import express from "express";
import User from "./models/User.js";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import connectDB from "./config/db.js";
import { validateInput } from "./middleware/validate.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { notificationEvents } from "./utils/events.js";
import Settings from "./models/Settings.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// ── Environment Validation ──────────────────────────────────────
const REQUIRED_ENV = ["MONGO_URI"];
const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missingEnv.length) {
  console.error(
    `❌ Missing required environment variables: ${missingEnv.join(", ")}`
  );
}

// Fix EventEmitter memory leak warning for concurrent SSE connections
notificationEvents.setMaxListeners(0);

// Routes
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import supportRoutes from "./routes/supportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

const app = express();

// Security Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://fonts.googleapis.com",
        ],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
  })
);

const whitelist = process.env.CORS_WHITELIST
  ? process.env.CORS_WHITELIST.split(",").map((s) => s.trim())
  : ["http://localhost:5173", "http://localhost:5000"];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(validateInput);

// Serve uploads with 7-day cache (filenames are timestamp-based, so safe to cache)
const uploadsDir = path.join(__dirname, "uploads");
["avatars", "logos"].forEach((sub) => {
  const dir = path.join(uploadsDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
app.use(
  "/uploads",
  express.static(uploadsDir, { maxAge: "7d", immutable: true })
);

// ── Rate Limiters ───────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again in 15 minutes." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in an hour." },
});

app.use("/api/", apiLimiter);
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/setup/admin", authLimiter);
app.use("/api/auth/reset-password", authLimiter);

app.get("/", (_req, res) => res.send("API is running..."));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/notifications", notificationRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred"
      : err.message;

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// ── Ensure Admin Exists ───────────────────────────────────────
const ensureAdminExists = async () => {
  try {
    const existingAdmin = await User.findOne({
      $or: [{ role: "admin" }, { username: "admin" }],
    });
    if (existingAdmin) return;

    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123";

    await User.create({
      name: "System Admin",
      username: "admin",
      password: adminPassword,
      role: "admin",
      status: "approved",
      requiresPasswordChange: true,
    });

    console.log("🔥 Initial admin created! Username: admin");
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
};

// ── System Initialization ───────────────────────────────────────
const normalizeExistingUsers = async () => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        schoolName: "GradeX",
        logo: "/logo.png",
        developerName: "عبدالقادر محمد",
        grades: ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"],
        departments: ["عام"],
        sections: ["أ", "ب", "ج", "د"],
      });
      console.log("✅ Default settings created");
    }

    if (!settings.normalizedAt) {
      const users = await User.find({ normalizedName: { $exists: false } });
      if (users.length > 0) {
        for (const user of users) {
          await user.save();
        }
      }
      settings.normalizedAt = new Date();
      await settings.save();
    }
  } catch (err) {
    console.error("❌ Initialization error:", err.message);
  }
};

// ── Serverless-safe DB connection + init (runs once per cold start) ──
let isInitialized = false;
app.use(async (_req, _res, next) => {
  if (!isInitialized) {
    await connectDB();
    await normalizeExistingUsers();
    await ensureAdminExists();
    isInitialized = true;
  }
  next();
});

// ── Local dev only: start a real server ───────────────────────────
if (process.env.VERCEL !== "1") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    await connectDB();
    await normalizeExistingUsers();
    await ensureAdminExists();
    isInitialized = true;
    console.log(`🔥 Server running on http://localhost:${PORT}`);
  });
}

export default app;