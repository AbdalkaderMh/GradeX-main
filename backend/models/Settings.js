import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    schoolName: {
      type: String,
      default: "إعدادية هيت المهنية",
    },
    logo: {
      type: String,
      default: "/logo.png",
    },
    developerName: {
      type: String,
      default: "عبدالقادر محمد",
    },
    grades: {
      type: [String],
      default: ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"],
    },
    departments: {
      type: [String],
      default: [
        "هندسة الكهرباء",
        "هندسة الميكانيك",
        "اللحام",
        "تجميع وصيانة الحاسوب",
        "الأمن السيبراني",
      ],
    },
    sections: {
      type: [String],
      default: ["أ", "ب", "ج", "د"],
    },
    scoringSystems: {
      type: [
        {
          name: String,
          description: String,
          calculateFormula: String, // e.g. "total / count" or "sum"
        },
      ],
      default: [
        {
          name: "المتوسط الحسابي",
          description: "حساب مجموع الدرجات مقسوماً على عدد المواد",
          calculateFormula: "average",
        },
        {
          name: "المجموع الكلي",
          description: "حساب مجموع الدرجات فقط",
          calculateFormula: "sum",
        },
      ],
    },
    activeScoringSystem: {
      type: String,
      default: "average",
    },
    maxTotal: {
      type: Number,
      default: 100,
    },
    isCertificateEnabled: {
      type: Boolean,
      default: false,
    },
    currentRound: {
      type: String,
      default: "الأول",
    },
    academicYear: {
      type: String,
      default: "2025 - 2026",
    },
    normalizedAt: {
      type: Date
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
