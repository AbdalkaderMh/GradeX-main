import mongoose from "mongoose";

const teacherSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    subjects: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

teacherSchema.index({ username: 1 }, { unique: false });
const Teacher = mongoose.model("Teacher", teacherSchema);
export default Teacher;
