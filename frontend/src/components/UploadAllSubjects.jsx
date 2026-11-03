import { useState } from "react";
import api from "../api/axios";
import * as XLSX from "xlsx";
import { useNotification } from "../context/NotificationContext";
import { useOptions } from "../context/OptionsContext";

export default function UploadAllSubjects({ onDone }) {
  const { showNotification } = useNotification();
  const { options } = useOptions();
  const [file, setFile] = useState(null);
  const [inputKey, setInputKey] = useState(0); // لتفريغ خانة اختيار الملف بعد النجاح
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [grade, setGrade] = useState("");
  const [dept, setDept] = useState("");
  const [section, setSection] = useState("");

  const downloadTemplate = () => {
    const header = ["اسم الطالب", "التربية الإسلامية", "اللغة العربية", "اللغة الإنجليزية", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "الحاسوب", "الاجتماعيات"];
    const ws = XLSX.utils.aoa_to_sheet([header]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الدرجات");
    XLSX.writeFile(wb, "gradex_all_subjects_template.xlsx");
  };

  const resetFile = () => {
    setFile(null);
    setInputKey((k) => k + 1);
  };

  const requestPreview = async () => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await api.post("/admin/upload-preview-all", fd);
    return res.data;
  };

  const requestConfirm = async (students, publish) => {
    const res = await api.post("/admin/confirm-upload-all", {
      students,
      isPublished: publish,
      autoCreate,
      grade,
      department: dept,
      section,
    });
    return res.data;
  };

  const handlePreview = async () => {
    if (!file) return showNotification("يرجى اختيار ملف أولاً", "info");
    setLoading(true);
    try {
      const data = await requestPreview();
      setPreview(data);
      setResult(null);
    } catch (err) {
      showNotification(err.response?.data?.message || "فشل معاينة الملف", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (publish) => {
    if (!preview || !preview.students.length) return;
    setLoading(true);
    try {
      const data = await requestConfirm(preview.students, publish);
      setResult(data);
      setPreview(null);
      resetFile();
      if (onDone) onDone();
    } catch (err) {
      showNotification(err.response?.data?.message || "فشل حفظ الدرجات", "error");
    } finally {
      setLoading(false);
    }
  };

  // رفع ونشر مباشر: يعاين الملف ثم ينشر النتائج بدون خطوات إضافية.
  // إذا وُجدت تنبيهات في الملف، يتوقف ويعرض المعاينة ليراجعها المسؤول.
  const handleQuickPublish = async () => {
    if (!file) return showNotification("يرجى اختيار ملف أولاً", "info");
    setLoading(true);
    try {
      const data = await requestPreview();

      if (!data.students?.length) {
        showNotification("لم يتم العثور على أي طالب في الملف", "error");
        return;
      }

      if (data.errors?.length > 0) {
        setPreview(data);
        setResult(null);
        showNotification(
          `يوجد ${data.errors.length} تنبيه في الملف. راجع المعاينة ثم اضغط "حفظ ونشر النتائج"`,
          "info"
        );
        return;
      }

      const saved = await requestConfirm(data.students, true);
      setResult(saved);
      setPreview(null);
      resetFile();
      showNotification("تم رفع الدرجات ونشر النتائج", "success");
      if (onDone) onDone();
    } catch (err) {
      showNotification(err.response?.data?.message || "فشل رفع ونشر النتائج", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mt-12 bg-surface-container-lowest rounded-2xl p-6 lg:p-8 shadow-sm text-right">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl lg:text-2xl font-extrabold">رفع كل المواد في ملف واحد</h3>
          <p className="text-xs lg:text-sm text-on-surface-variant mt-1">
            عمود لاسم الطالب، ثم عمود لكل مادة. عنوان العمود هو اسم المادة.
          </p>
        </div>
        <button onClick={downloadTemplate} className="px-5 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors text-sm">
          تحميل نموذج كل المواد
        </button>
      </div>

      {result && (
        <div className="mb-6 p-4 rounded-2xl bg-green-100 text-green-800 text-sm font-bold">
          تم حفظ {result.saved} طالب، وتخطي {result.skipped}، وإنشاء {result.created} حساب جديد.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <select value={grade} onChange={(e) => setGrade(e.target.value)} className="bg-surface-container-low rounded-lg text-sm p-2">
          <option value="">الصف (للطلاب الجدد فقط)</option>
          {options.grades?.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={dept} onChange={(e) => setDept(e.target.value)} className="bg-surface-container-low rounded-lg text-sm p-2">
          <option value="">القسم (للطلاب الجدد فقط)</option>
          {options.departments?.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={section} onChange={(e) => setSection(e.target.value)} className="bg-surface-container-low rounded-lg text-sm p-2">
          <option value="">الشعبة (للطلاب الجدد فقط)</option>
          {options.sections?.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 mb-4 text-xs font-bold text-on-surface-variant cursor-pointer">
        <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} />
        إنشاء حسابات للأسماء الجديدة تلقائياً
      </label>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
        <input
          key={inputKey}
          type="file"
          accept=".xlsx, .xls"
          onChange={(e) => { setFile(e.target.files[0]); setPreview(null); setResult(null); }}
          className="flex-1 text-sm"
        />
        <button
          onClick={handlePreview}
          disabled={loading || !file}
          className="px-6 py-2 bg-surface-container-high text-on-surface rounded-lg font-medium disabled:opacity-50"
        >
          {loading ? "جاري المعالجة..." : "معاينة فقط"}
        </button>
        <button
          onClick={handleQuickPublish}
          disabled={loading || !file}
          className="px-6 py-2 academic-gradient text-white rounded-lg font-bold disabled:opacity-50"
        >
          {loading ? "جاري المعالجة..." : "رفع ونشر مباشرة"}
        </button>
      </div>

      {preview && (
        <div>
          <div className="flex flex-wrap gap-2 mb-3">
            {preview.subjectNames.map((n) => (
              <span key={n} className="text-[11px] bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full font-bold">{n}</span>
            ))}
          </div>
          {preview.errors?.length > 0 && (
            <p className="text-xs text-red-600 font-bold mb-3">يوجد {preview.errors.length} تنبيه في الملف: {preview.errors[0]}</p>
          )}
          <div className="overflow-x-auto border border-surface-container rounded-xl">
            <table className="w-full text-right text-xs min-w-[500px]">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">المواد والدرجات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {preview.students.slice(0, 50).map((s, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-bold">{s.name}</td>
                    <td className="px-4 py-3">{s.exists ? <span className="text-primary font-bold">مسجل</span> : <span className="text-orange-600 font-bold">غير مسجل</span>}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.subjects.map((sub, j) => (
                          <span key={j} className="bg-surface-container px-2 py-0.5 rounded-full">{sub.name}: {sub.score}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.students.length > 50 && (
            <p className="text-xs text-on-surface-variant mt-2">+ {preview.students.length - 50} طالب آخر في الملف</p>
          )}
          <div className="flex gap-3 mt-4">
            <button onClick={() => handleConfirm(false)} disabled={loading} className="px-6 py-2 rounded-xl bg-surface-container-high font-semibold disabled:opacity-50">
              حفظ كمسودة
            </button>
            <button onClick={() => handleConfirm(true)} disabled={loading} className="px-8 py-2 rounded-xl academic-gradient text-white font-bold disabled:opacity-50">
              حفظ ونشر النتائج
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
