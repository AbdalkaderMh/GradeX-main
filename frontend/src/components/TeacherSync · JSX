import { useState } from "react";
import api from "../api/axios";
import * as XLSX from "xlsx";
import { useNotification } from "../context/NotificationContext";

// يقرأ عموداً من الصف بأي اسم محتمل للعنوان
const pick = (row, keys) => {
  for (const k of Object.keys(row)) {
    if (keys.includes(String(k).trim().toLowerCase())) return row[k];
  }
  return "";
};

export default function TeacherSync() {
  const { showNotification } = useNotification();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSync = async () => {
    if (!file) {
      showNotification("يرجى اختيار ملف الأساتذة أولاً", "info");
      return;
    }
    setLoading(true);
    try {
      // 1) قراءة ملف Excel: عمود الاسم وعمود المواد
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      const teachers = rows
        .map((r) => ({
          name: String(pick(r, ["الاسم", "اسم الاستاذ", "اسم الأستاذ", "اسم المعلم", "name"])).trim(),
          subjects: String(pick(r, ["المواد", "المادة", "subjects", "subject"])).trim(),
        }))
        .filter((t) => t.name);

      if (teachers.length === 0) {
        showNotification("لم أجد أسماء. تأكد أن عنوان العمود هو: الاسم", "error");
        return;
      }

      // 2) إرسالها للخادم وطلب الرد كملف
      const res = await api.post("/admin/sync-teachers", { teachers }, { responseType: "blob" });

      // 3) إن كان الرد JSON فمعناه لا يوجد أساتذة جدد
      const type = res.headers["content-type"] || "";
      if (type.includes("application/json")) {
        const info = JSON.parse(await res.data.text());
        showNotification(info.message || "لا يوجد معلمون جدد", "info");
        return;
      }

      // 4) تنزيل ملف Excel للحسابات الجديدة
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "new-teachers.xlsx";
      a.click();
      URL.revokeObjectURL(url);
      showNotification("تم إنشاء حسابات الأساتذة الجدد وتنزيل الملف", "success");
    } catch (err) {
      let msg = "حدث خطأ أثناء المزامنة";
      try {
        if (err.response?.data instanceof Blob) {
          msg = JSON.parse(await err.response.data.text()).message || msg;
        }
      } catch {
        /* تجاهل */
      }
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16, margin: "16px 0" }}>
      <h3 style={{ marginBottom: 8 }}>إنشاء حسابات الأساتذة الجدد</h3>
      <p style={{ fontSize: 14, marginBottom: 12 }}>
        ارفع ملف Excel فيه عمودان: <b>الاسم</b> و<b>المواد</b>. سيُنشأ حساب للأساتذة الجدد فقط،
        ويُتجاهل من لهم حساب مسبقاً، ثم يُنزَّل ملف بأسماء المستخدمين وكلمات المرور.
      </p>
      <input
        type="file"
        accept=".xlsx,.xls"
        onChange={(e) => setFile(e.target.files[0] || null)}
      />
      <button
        onClick={handleSync}
        disabled={loading}
        style={{ marginInlineStart: 12, padding: "8px 16px", cursor: "pointer" }}
      >
        {loading ? "جارٍ المعالجة..." : "إنشاء وتنزيل"}
      </button>
    </div>
  );
}
