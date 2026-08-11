import User from "../models/User.js";
import Student from "../models/Student.js";
import Teacher from "../models/Teacher.js";
import Settings from "../models/Settings.js";
import { parseExcel } from "../utils/excelParser.js";
import { generateUsername } from "../utils/idGenerator.js";
import { normalizeArabic } from "../utils/textUtils.js";
import Notification from "../models/Notification.js";
import AuditLog from "../models/Auditlog.js";

const getSettings = async () => {
    const settings = await Settings.findOne();
    if (!settings) {
      throw new Error("Settings not found. Please initialize the system.");
    }
    return settings;
  };

/**
 * UPLOAD PREVIEW (No save)
 */
export const uploadPreview = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { subjectName, grade, department } = req.body;

    // Strict Teacher Authorization
    if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.subjects.includes(subjectName)) {
            return res.status(403).json({ message: "غير مخول لمعاينة درجات هذه المادة" });
        }
    }
    const { students, errors } = parseExcel(req.file.buffer, { subjectName });

    const filename = req.file.originalname;
    let inferredGrade = grade;
    let inferredDept = department;

    const settings = await getSettings();

    if (!inferredGrade) {
        for (const g of settings.grades) {
            if (filename.includes(g)) { inferredGrade = g; break; }
        }
    }
    if (!inferredDept) {
        for (const d of settings.departments) {
            if (filename.includes(d)) { inferredDept = d; break; }
        }
    }

    const enrichedStudents = await Promise.all(students.map(async (s) => {
        const norm = normalizeArabic(s.name);
        const user = await User.findOne({
            $or: [{ name: s.name }, { normalizedName: norm }],
            role: "student"
        });
        return {
            ...s,
            username: user ? user.username : "غير مسجل",
            studentKey: user ? "[محفوظ]" : "---",
            exists: !!user,
            subjects: [{ name: subjectName || "General", grade: s.score }]
        };
    }));

    res.json({
      success: true,
      students: enrichedStudents,
      meta: {
        grade: inferredGrade || (settings.grades.length ? settings.grades[0] : ""),
        department: inferredDept || (settings.departments.length ? settings.departments[0] : ""),
        academicYear: settings.academicYear,
        section: req.body.section || "أ"
      },
      summary: {
        total: students.length,
        subjectName: subjectName || "General"
      },
      errors
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * CONFIRM UPLOAD (Save to DB)
 */
export const confirmUpload = async (req, res) => {
  try {
    const { students, isPublished, subjectName, autoCreate, grade, department, section } = req.body;
    const activeSubject = subjectName || "General";

    // Strict Teacher Authorization
    if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.subjects.includes(activeSubject)) {
            return res.status(403).json({ message: "غير مخول لنشر درجات هذه المادة" });
        }
    }

    let saved = 0;
    let skipped = 0;
    let createdCount = 0;
    const finalStudents = [];

    // Batch pre-fetch all existing users to minimize queries
    const studentNames = students.map(s => s.name);
    const studentNorms = studentNames.map(name => normalizeArabic(name));

    const existingUsers = await User.find({
        role: "student",
        $or: [
            { name: { $in: studentNames } },
            { normalizedName: { $in: studentNorms } }
        ]
    });

    const userMap = new Map();
    existingUsers.forEach(u => {
        userMap.set(u.name, u);
        userMap.set(u.normalizedName, u);
    });

    const existingProfiles = await Student.find({
        userId: { $in: existingUsers.map(u => u._id) }
    });
    const profileMap = new Map();
    existingProfiles.forEach(p => profileMap.set(p.userId.toString(), p));

    const userOps = [];
    const studentOps = [];
    const notificationOps = [];

    for (const s of students) {
        const norm = normalizeArabic(s.name);
        let user = userMap.get(s.name) || userMap.get(norm);

        if (!user && !autoCreate) {
            skipped++;
            continue;
        }

        if (!user && autoCreate) {
            const username = await generateUsername("student");
            user = new User({
                name: s.name,
                username,
                password: username,
                role: "student",
                status: "approved",
                requiresPasswordChange: true
            });
            await user.save(); // Need ID for Student profile
            createdCount++;

            userMap.set(s.name, user);
            userMap.set(normalizeArabic(s.name), user);
        }

        let studentProfile = user ? profileMap.get(user._id.toString()) : null;
        if (!studentProfile) {
            if (autoCreate && user) {
                studentProfile = new Student({
                    userId: user._id,
                    grade: grade || "غير محدد",
                    department: department || "غير محدد",
                    section: section || "أ",
                    subjects: [],
                    total: 0,
                    average: 0,
                    isPublished: false
                });
                // Will save later in bulk
                profileMap.set(user._id.toString(), studentProfile);
            } else {
                skipped++;
                continue;
            }
        }

        const subIdx = studentProfile.subjects.findIndex(sub => sub.name === activeSubject);
        const newScore = s.score || 0;

        if (subIdx > -1) {
            const sub = studentProfile.subjects[subIdx];
            sub.improved = newScore > sub.currentScore;
            sub.previousScore = sub.currentScore;
            sub.currentScore = newScore;
            // Add to history
            if (!sub.history) sub.history = [];
            sub.history.push({ round: "تحديث", score: newScore });
        } else {
            studentProfile.subjects.push({
                name: activeSubject,
                currentScore: newScore,
                previousScore: 0,
                improved: false,
                history: [{ round: "أولي", score: newScore }]
            });
        }

        const scores = studentProfile.subjects.map(sub => sub.currentScore);
        studentProfile.total = scores.reduce((a, b) => a + b, 0);
        studentProfile.average = scores.length ? (studentProfile.total / scores.length) : 0;
        studentProfile.isPublished = isPublished !== undefined ? isPublished : studentProfile.isPublished;

        studentOps.push({
            replaceOne: {
                filter: { userId: user._id },
                replacement: studentProfile.toObject(),
                upsert: true
            }
        });

        if (isPublished) {
            notificationOps.push({
                recipient: user._id,
                title: "تم نشر نتائج جديدة",
                message: `تم تحديث نتائجك لمادة ${activeSubject}. يمكنك التحقق منها الآن.`,
                type: "result"
            });
        }

        saved++;

        finalStudents.push({
            name: s.name,
            username: user ? user.username : "غير مسجل",
            studentKey: (user && autoCreate && user.requiresPasswordChange && (user.createdAt.getTime() > Date.now() - 60000)) ? user.username : "[محفوظ]"
        });
    }

    if (studentOps.length > 0) {
        await Student.bulkWrite(studentOps);
    }

    if (notificationOps.length > 0) {
        await Notification.insertMany(notificationOps);
    }

    // Record Audit Log
    await AuditLog.create({
        actor: req.user._id,
        actorName: req.user.name,
        actorRole: req.user.role,
        action: "upload_grades",
        target: `مادة: ${activeSubject} | ${grade} - ${department}`,
        details: { savedCount: saved, createdCount, isPublished }
    });

    res.json({
        success: true,
        message: "Results processed",
        saved,
        skipped,
        created: createdCount,
        students: finalStudents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * UPLOAD AND PROCESS GRADES (Teacher/Legacy Flow)
 */
export const uploadGrades = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "File required" });

    const { subjectName } = req.body;

    // Strict Teacher Authorization
    if (req.user.role === "teacher") {
        const teacher = await Teacher.findOne({ userId: req.user._id });
        if (!teacher || !teacher.subjects.includes(subjectName)) {
            return res.status(403).json({ message: "غير مخول لرفع درجات هذه المادة" });
        }
    }
    const { students: parsedStudents, errors } = parseExcel(req.file.buffer, { subjectName });

    if (errors.length && parsedStudents.length === 0) return res.status(400).json({ errors });

    let updatedCount = 0;
    let skippedCount = 0;

    for (const s of parsedStudents) {
      const norm = normalizeArabic(s.name);
      const user = await User.findOne({
          $or: [{ name: s.name }, { normalizedName: norm }],
          role: "student"
      });
      if (!user) {
        skippedCount++;
        continue;
      }

      const student = await Student.findOne({ userId: user._id });
      if (!student) {
        skippedCount++;
        continue;
      }

      const subjectIdx = student.subjects.findIndex(sub => sub.name === subjectName);
      if (subjectIdx > -1) {
        const sub = student.subjects[subjectIdx];
        sub.improved = s.score > sub.currentScore;
        sub.previousScore = sub.currentScore;
        sub.currentScore = s.score;
      } else {
        student.subjects.push({
          name: subjectName,
          currentScore: s.score,
          previousScore: 0,
          improved: false
        });
      }

      const numericScores = student.subjects.map(sub => sub.currentScore);
      student.total = numericScores.reduce((a, b) => a + b, 0);
      student.average = numericScores.length ? (student.total / numericScores.length) : 0;

      await student.save();
      updatedCount++;
    }

    res.json({
      message: "Processing complete",
      updated: updatedCount,
      skipped: skippedCount
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * BULK CREATE PREVIEW
 */
export const bulkCreatePreview = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "File required" });
        const { students, meta, errors } = parseExcel(req.file.buffer, { filename: req.file.originalname });

        const enriched = await Promise.all(students.map(async (s) => {
            const norm = normalizeArabic(s.name);
            const user = await User.findOne({ $or: [{ name: s.name }, { normalizedName: norm }], role: "student" });
            return {
                ...s,
                exists: !!user,
                username: user ? user.username : "سيُنشأ آلياً"
            };
        }));

        res.json({ success: true, students: enriched, meta, errors });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * BULK UPDATE PUBLISH STATUS
 */
export const bulkUpdatePublishStatus = async (req, res) => {
    try {
        const { grade, department, section, isPublished } = req.body;
        const query = {
            ...(grade && { grade }),
            ...(department && { department }),
            ...(section && { section })
        };

        const result = await Student.updateMany(query, { isPublished });

        // Record Audit Log
        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: isPublished ? "bulk_publish" : "unpublish_results",
            target: `${grade || 'الكل'} - ${department || 'الكل'} - ${section || 'الكل'}`,
            details: { modifiedCount: result.modifiedCount }
        });

        if (isPublished) {
            const students = await Student.find(query);
            for (const s of students) {
                await Notification.create({
                    recipient: s.userId,
                    title: "تم نشر نتائج جديدة",
                    message: "قامت الإدارة بنشر نتائجك الرسمية. يمكنك التحقق منها الآن.",
                    type: "result"
                });
            }
        }

        res.json({ success: true, modifiedCount: result.modifiedCount });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * BULK CREATE STUDENTS (Accounts Only)
 */
export const bulkCreateStudents = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "File required" });

        const { grade, department, section } = req.body;
        const { students, meta, errors } = parseExcel(req.file.buffer, { filename: req.file.originalname });

        if (errors.length && students.length === 0) return res.status(400).json({ errors });

        let created = 0;
        let existingCount = 0;
        const createdAccounts = [];
        const studentOps = [];

        // Pre-fetch all students to check existence
        const studentNames = students.map(s => s.name);
        const studentNorms = studentNames.map(name => normalizeArabic(name));

        const existingUsers = await User.find({
            role: "student",
            $or: [
                { name: { $in: studentNames } },
                { normalizedName: { $in: studentNorms } }
            ]
        });

        const userMap = new Map();
        existingUsers.forEach(u => {
            userMap.set(u.name, u);
            userMap.set(u.normalizedName, u);
        });

        for (const s of students) {
            const norm = normalizeArabic(s.name);
            let user = userMap.get(s.name) || userMap.get(norm);

            if (!user) {
                const username = await generateUsername("student");
                user = new User({
                    name: s.name,
                    username,
                    password: username,
                    role: "student",
                    status: "approved",
                    requiresPasswordChange: true
                });
                await user.save();

                const studentProfile = new Student({
                    userId: user._id,
                    grade: grade || meta.grade || "غير محدد",
                    department: department || meta.department || "غير محدد",
                    section: section || meta.section || "أ",
                    subjects: [],
                    total: 0,
                    average: 0,
                    isPublished: false
                });

                studentOps.push({
                    insertOne: { document: studentProfile.toObject() }
                });

                createdAccounts.push({
                    name: s.name,
                    username: username,
                    entryKey: username
                });
                created++;
                // Update map for cases where same name is twice in same excel
                userMap.set(s.name, user);
                userMap.set(norm, user);
            } else {
                existingCount++;
            }
        }

        if (studentOps.length > 0) {
            await Student.bulkWrite(studentOps);
        }

        // Record Audit Log
        await AuditLog.create({
            actor: req.user._id,
            actorName: req.user.name,
            actorRole: req.user.role,
            action: "bulk_create_students",
            target: `${grade} - ${department}`,
            details: { created, existing: existingCount }
        });

        res.json({
            success: true,
            message: "تم إنشاء الحسابات بنجاح",
            created,
            existing: existingCount,
            accounts: createdAccounts
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
