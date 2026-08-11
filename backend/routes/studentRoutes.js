import express from "express";
import Student from "../models/Student.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { generateShareLink, getSharedResult } from "../controllers/studentController.js";

const router = express.Router();

router.get("/me", protect, authorize("student"), async (req, res) => {
    try {
        const student = await Student.findOne({ userId: req.user._id });
        if (!student || !student.isPublished) {
            return res.status(404).json({ message: "النتائج غير متاحة حالياً" });
        }

        // Calculate Rank using O(n) aggregation
        const stats = await Student.aggregate([
          { $match: { grade: student.grade, department: student.department } },
          {
            $group: {
              _id: null,
              totalPeers: { $sum: 1 },
              higherAverage: { $sum: { $cond: [{ $gt: ["$average", student.average] }, 1, 0] } }
            }
          }
        ]);

        const { totalPeers, higherAverage } = stats[0] || { totalPeers: 1, higherAverage: 0 };
        const rank = higherAverage + 1;

        // Aggregate class averages for comparison
        const comparison = await Student.aggregate([
            { $match: { grade: student.grade, department: student.department } },
            { $unwind: "$subjects" },
            {
                $group: {
                    _id: "$subjects.name",
                    avgScore: { $avg: "$subjects.currentScore" },
                    maxScore: { $max: "$subjects.currentScore" }
                }
            }
        ]);

        const studentData = student.toObject();
        studentData.rank = rank;
        studentData.totalPeers = totalPeers;
        studentData.name = req.user.name;
        studentData.username = req.user.username;
        studentData.comparison = comparison.reduce((acc, curr) => {
            acc[curr._id] = { avg: Math.round(curr.avgScore * 10) / 10, max: curr.maxScore };
            return acc;
        }, {});

        res.json(studentData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post("/share", protect, authorize("student"), generateShareLink);
router.get("/shared/:token", getSharedResult);

export default router;
