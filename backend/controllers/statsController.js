import User from "../models/User.js";
import Student from "../models/Student.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/Auditlog.js";

/**
 * GET ADMIN STATS
 */
export const getStats = async (req, res) => {
    try {
        const totalStudents = await User.countDocuments({ role: "student" });
        const pendingTeachers = await User.countDocuments({ role: "teacher", status: "pending" });
        const approvedTeachers = await User.countDocuments({ role: "teacher", status: "approved" });
        const publishedCount = await Student.countDocuments({ isPublished: true });

        const gradesData = await Student.aggregate([
            {
                $group: {
                    _id: "$grade",
                    avg: { $avg: "$average" },
                    count: { $sum: 1 },
                    passCount: {
                        $sum: { $cond: [{ $gte: ["$average", 50] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    grade: "$_id",
                    avg: { $round: ["$avg", 1] },
                    count: 1,
                    passRate: { $round: [{ $multiply: [{ $divide: ["$passCount", "$count"] }, 100] }, 1] }
                }
            },
            { $sort: { grade: 1 } }
        ]);

        const recentActivity = await AuditLog.find().sort({ createdAt: -1 }).limit(10);

        res.json({
            totalStudents,
            pendingTeachers,
            approvedTeachers,
            publishedCount,
            grades: gradesData,
            recentActivity: recentActivity.map(log => ({
                id: log._id,
                title: log.action.replace(/_/g, ' '),
                student: log.target,
                time: log.createdAt
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments();

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
