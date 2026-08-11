import SupportMessage from "../models/SupportMessage.js";
import Notification from "../models/Notification.js";
import Student from "../models/Student.js";
import User from "../models/User.js";

export const sendMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const newMessage = await SupportMessage.create({
      name,
      email,
      message,
      studentId: req.user?.id
    });

    // Notify Admins
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
        await Notification.create({
            recipient: admin._id,
            title: "رسالة دعم جديدة",
            message: `وصلت رسالة جديدة من ${name}`,
            link: "/admin/support",
            type: "support"
        });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "admin") {
      query = {};
    } else if (req.user.role === "student") {
      query = { studentId: req.user.id };
    } else if (req.user.role === "teacher") {
      // Teachers only see messages they sent or received (if applicable)
      // For now, based on current model, they see messages they sent
      query = { studentId: req.user.id };
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const messages = await SupportMessage.find(query).sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;
    const updated = await SupportMessage.findByIdAndUpdate(id, { status, reply }, { new: true });

    if (updated.studentId) {
        await Notification.create({
            recipient: updated.studentId,
            title: "تحديث على طلب الدعم",
            message: status === "solved" ? "تم الرد على طلب الدعم الخاص بك" : "تم تحديث حالة طلب الدعم",
            link: "/support",
            type: "support"
        });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
