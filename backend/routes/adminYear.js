import express from "express";
import User from "../models/User.js";
import Student from "../models/Student.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/new-year", protect, adminOnly, async (req, res) => {
  try {
    if (req.body.confirm !== "حذف") {
      return res.status(400).json({ success: false, message: "لم يتم التأكيد" });
    }

    const studentUsers = await User.find({ role: "student" }).select("_id").lean();
    const ids = studentUsers.map((u) => u._id);

    const studentsResult = await Student.deleteMany({ userId: { $in: ids } });
    const usersResult = await User.deleteMany({ role: "student" });

    res.json({
      success: true,
      deletedUsers: usersResult.deletedCount,
      deletedStudents: studentsResult.deletedCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "حدث خطأ في الخادم" });
  }
});

export default router;
