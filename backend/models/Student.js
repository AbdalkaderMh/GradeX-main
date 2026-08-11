import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    department: String,
    grade: String,
    section: String,
    specialty: String,
    round: { type: String, default: "الأول" },
    serialNo: String,
    isPublished: { type: Boolean, default: false },
    subjects: [
      {
        name: { type: String, required: true },
        currentScore: { type: Number, default: 0 },
        previousScore: { type: Number, default: 0 },
        improved: { type: Boolean, default: false },
        details: { type: Map, of: String },
        // FIX: history array so multiple rounds are tracked
        history: [
          {
            round: String,
            score: Number,
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
      },
    ],
    total: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    shareToken: { type: String, index: true },
    shareTokenExpiry: Date,
  },
  { timestamps: true }
);

studentSchema.index({ grade: 1, department: 1, section: 1, average: -1 });
studentSchema.index({ "subjects.name": 1 });
studentSchema.index({ average: -1 });

studentSchema.index({ username: 1 }, { unique: false }); // Ensure no accidental unique index on a non-existent field
const Student = mongoose.model("Student", studentSchema);
export default Student;
