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

    // تجاهل أي سجل طالب لا يملك حساب مستخدم مرتبط (سجل يتيم)،
    // بدلاً من الانهيار عند محاولة قراءة .name أو .username من قيمة null.
    const validStudents = students.filter((studentDoc) => studentDoc.userId);
    const skippedCount = students.length - validStudents.length;

    const data = validStudents.map(studentDoc => ({
      "الاسم": studentDoc.userId.name,
      "اسم المستخدم": studentDoc.userId.username,
      "رمز الدخول": studentDoc.userId.username,
      "الصف": studentDoc.grade,
      "القسم": studentDoc.department,
      "الشعبة": studentDoc.section
    }));

    if (data.length === 0) {
      return res.status(404).json({
        message: skippedCount > 0
          ? `لا توجد سجلات صالحة للتصدير. تم تجاهل ${skippedCount} سجل بلا حساب مستخدم مرتبط.`
          : "لا توجد بيانات طلاب مطابقة لهذا الصف/القسم."
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Credentials");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=credentials_${grade}_${department}.xlsx`);
    res.send(buffer);
  } catch (error) {
    // طباعة الخطأ الفعلي في سجلات الخادم (Vercel Logs) لتسهيل التشخيص مستقبلاً.
    console.error("exportStudents error:", error);
    res.status(500).json({ message: error.message });
  }
};
