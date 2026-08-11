import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "solved"],
      default: "pending"
    },
    reply: { type: String },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);
export default SupportMessage;
