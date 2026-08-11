import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorName: { type: String },
    actorRole: { type: String, enum: ["admin", "teacher"] },
    action: {
      type: String,
      required: true,
      enum: [
        "upload_grades",
        "publish_results",
        "unpublish_results",
        "create_student",
        "update_student",
        "delete_student",
        "delete_subject",
        "bulk_create_students",
        "bulk_publish",
        "approve_teacher",
        "create_teacher",
        "update_settings",
      ],
    },
    target: {
      type: String, // Human-readable description: "Student: أحمد علي" / "Grade: الثالث"
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // Any extra context (subject name, count, etc.)
    },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export default AuditLog;
