import mongoose from "mongoose";
import { emitNotification } from "../utils/events.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    link: { type: String },
    type: {
        type: String,
        enum: ["result", "support", "system"],
        default: "system"
    }
  },
  { timestamps: true }
);

notificationSchema.post("save", function(doc) {
    emitNotification(doc.recipient.toString(), doc);
});

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
