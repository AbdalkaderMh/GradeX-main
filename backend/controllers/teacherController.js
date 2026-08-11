import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import AuditLog from "../models/Auditlog.js";
import { generateUsername } from "../utils/idGenerator.js";

/**
 * GET ALL TEACHERS (Admin)
 */
export const getTeachers = async (req, res) => {
    try {
        const users = await User.find({ role: "teacher" }).select("-password").lean();
        const userIds = users.map(u => u._id);
        const profiles = await Teacher.find({ userId: { $in: userIds } }).lean();

        const profileMap = new Map();
        profiles.forEach(p => profileMap.set(p.userId.toString(), p));

        const teachersData = users.map((u) => {
            const profile = profileMap.get(u._id.toString());
            return {
                ...u,
                subjects: profile ? profile.subjects : []
            };
        });
        res.json(teachersData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * CREATE TEACHER (Admin)
 */
export const createTeacher = async (req, res) => {
    try {
        const { name, password, subjects } = req.body;
        if (!name || !password) return res.status(400).json({ message: "Name and password required" });

        const username = await generateUsername("teacher");

        const user = await User.create({
            name,
            username,
            password,
            role: "teacher",
            status: "approved",
            requiresPasswordChange: true
        });

        await Teacher.create({
            userId: user._id,
            subjects: subjects || []
        });

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "create_teacher",
            target: `المعلم: ${name}`,
            details: { subjects }
        });

        res.status(201).json({
            message: "تم إنشاء حساب المعلم بنجاح",
            username: user.username
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET PENDING TEACHERS
 */
export const getPendingTeachers = async (req, res) => {
    try {
        const teachers = await User.find({ role: "teacher", status: "pending" }).select("-password");
        res.json(teachers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * TEACHER APPROVAL & SUBJECT ASSIGNMENT
 */
export const approveTeacher = async (req, res) => {
    try {
        const { teacherId } = req.params;
        const { subjects } = req.body; // Array of subject names

        const user = await User.findByIdAndUpdate(
            teacherId,
            {
                status: "approved",
                $inc: { roleVersion: 1 }
            },
            { new: true }
        );
        await Teacher.findOneAndUpdate({ userId: teacherId }, { subjects }, { upsert: true });

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "approve_teacher",
            target: `المعلم: ${user.name}`,
            details: { subjects }
        });

        res.json({ message: "Teacher approved and subjects assigned", user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * GET TEACHER ANALYTICS (Teacher)
 */
export const getTeacherStats = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) return res.status(404).json({ message: "Teacher record not found" });

        const subjects = teacher.subjects;
        const stats = await Promise.all(subjects.map(async (subject) => {
            const result = await Student.aggregate([
                { $unwind: "$subjects" },
                { $match: { "subjects.name": subject } },
                {
                    $group: {
                        _id: "$subjects.name",
                        avgScore: { $avg: "$subjects.currentScore" },
                        totalStudents: { $count: {} },
                        passCount: {
                            $sum: { $cond: [{ $gte: ["$subjects.currentScore", 50] }, 1, 0] }
                        },
                        atRiskCount: {
                            $sum: { $cond: [{ $and: [{ $gte: ["$subjects.currentScore", 50] }, { $lt: ["$subjects.currentScore", 65] }] }, 1, 0] }
                        }
                    }
                }
            ]);

            if (result.length > 0) {
                const s = result[0];
                return {
                    subject,
                    average: Math.round(s.avgScore * 10) / 10,
                    totalStudents: s.totalStudents,
                    passRate: Math.round((s.passCount / s.totalStudents) * 100),
                    atRiskCount: s.atRiskCount
                };
            }
            return { subject, average: 0, totalStudents: 0, passRate: 0 };
        }));

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
