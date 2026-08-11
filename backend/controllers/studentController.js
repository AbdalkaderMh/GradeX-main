import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import AuditLog from "../models/Auditlog.js";
import XLSX from "xlsx";
import { randomBytes } from "crypto";

/**
 * GET ALL STUDENTS (Admin) - Optimized with Aggregation
 */
export const getStudents = async (req, res) => {
    try {
      const { grade, department, section, search, page = 1, limit = 50 } = req.query;
      const skip = (parseInt(page) - 1) * parseInt(limit);

      const pipeline = [
          // 1. Initial Match for Student Profile
          { $match: {
              ...(grade && { grade }),
              ...(department && { department }),
              ...(section && { section })
          }},
          // 2. Join with User
          { $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "user"
          }},
          { $unwind: "$user" },
          // 3. Search Filter on User Name
          ...(search ? [{ $match: { "user.name": { $regex: search, $options: "i" } } }] : []),
          // 4. Calculate Rank globally within Grade/Dept
          { $setWindowFields: {
              partitionBy: { grade: "$grade", department: "$department" },
              sortBy: { average: -1 },
              output: { rank: { $rank: {} } }
          }},
          // 5. Facet for Metadata and Data
          { $facet: {
              metadata: [{ $count: "total" }],
              data: [
                  { $sort: { average: -1 } },
                  { $skip: skip },
                  { $limit: parseInt(limit) },
                  { $project: {
                      _id: 1,
                      userId: "$user._id",
                      name: "$user.name",
                      username: "$user.username",
                      requiresPasswordChange: "$user.requiresPasswordChange",
                      grade: 1,
                      department: 1,
                      section: 1,
                      average: 1,
                      total: 1,
                      subjects: 1,
                      isPublished: 1,
                      rank: 1
                  }}
              ]
          }}
      ];

      const results = await Student.aggregate(pipeline);
      const total = results[0].metadata[0]?.total || 0;
      const students = results[0].data;

      res.json({
        students,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        totalStudents: total
      });
    } catch (err) {
      // Fallback for older MongoDB versions without $setWindowFields
      try {
        const { grade, department, section, search, page = 1, limit = 50 } = req.query;
        const query = {
            ...(grade && { grade }),
            ...(department && { department }),
            ...(section && { section })
        };
        const userMatch = { role: "student", ...(search && { name: { $regex: search, $options: "i" } }) };

        const allStudents = await Student.find(query).populate({
            path: "userId",
            match: userMatch,
            select: "name username requiresPasswordChange"
        });

        const filtered = allStudents.filter(s => s.userId);
        const sorted = filtered.sort((a, b) => b.average - a.average);
        const paginated = sorted.slice((parseInt(page) - 1) * parseInt(limit), parseInt(page) * parseInt(limit));

        // Optimized rank calculation: use the already fetched and sorted full list for the given query
        const studentsWithRank = paginated.map((s) => {
            const rank = sorted.findIndex(item => item.average <= s.average) + 1;
            return {
                ...s.toObject(),
                name: s.userId.name,
                username: s.userId.username,
                requiresPasswordChange: s.userId.requiresPasswordChange,
                rank
            };
        });

        res.json({
            students: studentsWithRank,
            totalPages: Math.ceil(filtered.length / limit),
            currentPage: parseInt(page),
            totalStudents: filtered.length
        });
      } catch (fallbackErr) {
        res.status(500).json({ message: fallbackErr.message });
      }
    }
  };

  export const deleteStudent = async (req, res) => {
    try {
      const student = await Student.findById(req.params.id);
      if (student) {
        const user = await User.findById(student.userId);
        await User.findByIdAndDelete(student.userId);
        await Student.findByIdAndDelete(req.params.id);

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "delete_student",
            target: `الطالب: ${user?.name || student.userId}`,
            details: { studentId: req.params.id }
        });

        res.json({ message: "Student removed" });
      } else {
        res.status(404).json({ message: "Student not found" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

  export const deleteSubjectFromStudent = async (req, res) => {
    try {
        const { id, subjectName } = req.params;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ message: "Student not found" });

        student.subjects = student.subjects.filter(s => s.name !== subjectName);

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "delete_subject",
            target: `المادة: ${subjectName} للطالب ID: ${id}`,
        });

        // Recalculate totals
        const scores = student.subjects.map(sub => sub.currentScore);
        student.total = scores.reduce((a, b) => a + b, 0);
        student.average = scores.length ? (student.total / scores.length) : 0;

        await student.save();

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "update_student",
            target: `الطالب: ${name}`,
            details: { grade, department, section }
        });
        res.json(student);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
  };

  export const updateStudent = async (req, res) => {
    try {
      const { name, username, password, grade, department, section, average, total, isPublished } = req.body;
      const student = await Student.findById(req.params.id);

      if (student) {
        student.grade = grade || student.grade;
        student.department = department || student.department;
        student.section = section || student.section;
        student.average = average !== undefined ? average : student.average;
        student.total = total !== undefined ? total : student.total;
        student.isPublished = isPublished !== undefined ? isPublished : student.isPublished;

        const user = await User.findById(student.userId);
        if (user) {
          user.name = name || user.name;
          user.username = username || user.username;
          if (password) user.password = password;
          await user.save();
        }

        await student.save();

        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "update_student",
            target: `الطالب: ${user?.name || student.userId}`,
            details: { grade, department, section, average, total, isPublished }
        });

        // Return populated student
        const updated = await Student.findById(req.params.id).populate("userId", "name username");
        res.json({
            ...updated.toObject(),
            name: updated.userId.name,
            username: updated.userId.username
        });
      } else {
        res.status(404).json({ message: "Student not found" });
      }
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };

/**
 * EXPORT STUDENTS CREDENTIALS
 */
export const exportStudents = async (req, res) => {
  try {
    const { grade, department } = req.query;
    const query = {};
    if (grade) query.grade = grade;
    if (department) query.department = department;

    const students = await Student.find(query).populate("userId", "name username");

    const data = students.map(studentDoc => ({
      "الاسم": studentDoc.userId.name,
      "اسم المستخدم": studentDoc.userId.username,
      "رمز الدخول": studentDoc.userId.username,
      "الصف": studentDoc.grade,
      "القسم": studentDoc.department,
      "الشعبة": studentDoc.section
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=credentials_${grade}_${department}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET TEACHER'S STUDENTS
 */
export const getMyStudents = async (req, res) => {
    try {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher) return res.status(404).json({ message: "Teacher record not found" });

        const students = await Student.find({
            "subjects.name": { $in: teacher.subjects }
        }).populate("userId", "name username");

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

/**
 * GENERATE SHARE LINK
 */
export const generateShareLink = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id });
    if (!student) return res.status(404).json({ message: "Student record not found" });

    const token = randomBytes(16).toString("hex");
    student.shareToken = token;
    student.shareTokenExpiry = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
    await student.save();

    res.json({ shareUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/share/${token}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET SHARED RESULT
 */
export const getSharedResult = async (req, res) => {
  try {
    const { token } = req.params;
    const student = await Student.findOne({
      shareToken: token,
      shareTokenExpiry: { $gt: Date.now() },
      isPublished: true
    }).populate("userId", "name");

    if (!student) return res.status(404).json({ message: "الرابط غير صالح أو منتهي الصلاحية" });

    res.json({
        name: student.userId.name,
        grade: student.grade,
        department: student.department,
        section: student.section,
        subjects: student.subjects,
        total: student.total,
        average: student.average,
        academicYear: student.academicYear,
        round: student.round
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
