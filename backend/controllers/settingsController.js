import Settings from "../models/Settings.js";
import AuditLog from "../models/Auditlog.js";
import { processImage, deleteOldImage } from "../utils/imageHandler.js";

// ── Helper to get settings ──────────────────────────────────────
const getSettings = async () => {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error("إعدادات النظام غير موجودة. يرجى تهيئة النظام أولاً.");
    }
    return settings;
  };

/**
 * SYSTEM OPTIONS
 */
export const getDropdownOptions = async (_req, res) => {
    try {
      const settings = await getSettings();
      res.json({
        grades: settings.grades,
        departments: settings.departments,
        sections: settings.sections,
        scoringSystems: settings.scoringSystems,
        activeScoringSystem: settings.activeScoringSystem,
        maxTotal: settings.maxTotal,
        isCertificateEnabled: settings.isCertificateEnabled,
        schoolName: settings.schoolName,
        logo: settings.logo,
        developerName: settings.developerName,
        currentRound: settings.currentRound,
        academicYear: settings.academicYear,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };

export const uploadLogo = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        let settings = await getSettings();

        // Process new image
        const logoPath = await processImage(req.file.buffer, "logo");

        // Delete old logo if exists and it's an uploaded file
        if (settings.logo && settings.logo.startsWith("/uploads/")) {
            deleteOldImage(settings.logo);
        }

        settings.logo = logoPath;
        await settings.save();

        res.json({ success: true, logo: logoPath });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

  export const updateOptions = async (req, res) => {
    try {
      const settings = await getSettings();

      Object.assign(settings, req.body);
      await settings.save();

      await AuditLog.create({
          actor: req.user._id,
          actorName: req.user.name,
          actorRole: req.user.role,
          action: "update_settings",
          target: "إعدادات النظام",
          details: req.body
      });

      res.json({ success: true, settings });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  };
