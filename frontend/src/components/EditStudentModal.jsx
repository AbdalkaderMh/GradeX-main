import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import ConfirmModal from "./ConfirmModal";

// الحقول التفصيلية التي تظهر في الشهادة الصفراء (المفتاح الأول هو المعتمد، والثاني بديل قديم قد يأتي من Excel)
const DETAIL_FIELDS = [
  { key: "درجة الفصل الأول", alt: "الفصل الأول", label: "الفصل الأول" },
  { key: "نصف السنة", label: "نصف السنة" },
  { key: "درجة الفصل الثاني", alt: "الفصل الثاني", label: "الفصل الثاني" },
  { key: "السعي السنوي", label: "السعي السنوي" },
  { key: "الامتحان النهائي", label: "الامتحان النهائي" },
  { key: "درجة الإكمال", label: "درجة الإكمال" },
  { key: "بعد الإكمال", label: "بعد الإكمال" },
];

// مواد جاهزة للإضافة بنقرة واحدة (يمكنك تعديل القائمة)
const COMMON_SUBJECTS = [
  "التربية الإسلامية",
  "اللغة العربية",
  "اللغة الإنكليزية",
  "الرياضيات",
  "الفيزياء",
  "الكيمياء",
  "الأحياء",
  "الحاسوب",
  "التاريخ",
  "الجغرافية",
  "الاجتماعيات",
  "التربية الفنية",
  "التربية الرياضية",
];

const calcTotals = (subjects) => {
  const total = subjects.reduce((sum, s) => sum + (parseFloat(s.currentScore) || 0), 0);
  const average = subjects.length ? Math.round((total / subjects.length) * 100) / 100 : 0;
  return { total, average };
};

export default function EditStudentModal({ student, onClose, onUpdate }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({
    ...student,
    password: "",
    subjects: (student.subjects || []).map((s) => ({ ...s, details: { ...(s.details || {}) } })),
  });
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [openSubject, setOpenSubject] = useState(null);
  const [options, setOptions] = useState({ grades: [], departments: [], sections: [] });
  const [confirm, setConfirm] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    api.get("/admin/options").then((res) => setOptions(res.data));
  }, []);

  const handleGenerateResetToken = async () => {
    try {
      setLoading(true);
      const res = await api.post(`/auth/generate-reset-token/${student.userId._id || student.userId}`);
      setResetToken(res.data.token);
    } catch (err) {
      showNotification("فشل إنشاء رابط إعادة التعيين", "error");
    } finally {
      setLoading(false);
    }
  };

  // حذف مادة محفوظة سابقاً (عبر الخادم كما كان)
  const handleDeleteSavedSubject = (subjectName) => {
    setConfirm({
      isOpen: true,
      title: "حذف مادة",
      message: `هل أنت متأكد من حذف مادة ( ${subjectName} ) لهذا الطالب؟ سيتم إعادة احتساب المعدل والمجموع تلقائياً.`,
      onConfirm: async () => {
        try {
          setLoading(true);
          const res = await api.delete(`/admin/students/${student._id}/subjects/${subjectName}`);
          setForm((f) => ({
            ...f,
            subjects: f.subjects.filter((s) => s.name !== subjectName),
            total: res.data.total,
            average: res.data.average,
          }));
          showNotification("تم حذف المادة بنجاح", "success");
        } catch (err) {
          showNotification("فشل حذف المادة", "error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const updateSubject = (index, patch, recalc = false) => {
    setForm((f) => {
      const subjects = f.subjects.map((s, i) => (i === index ? { ...s, ...patch } : s));
      return recalc ? { ...f, subjects, ...calcTotals(subjects) } : { ...f, subjects };
    });
  };

  const setDetail = (index, key, value) => {
    setForm((f) => {
      const subjects = f.subjects.map((s, i) =>
        i === index ? { ...s, details: { ...(s.details || {}), [key]: value } } : s
      );
      return { ...f, subjects };
    });
  };

  const addSubject = (name = "") => {
    const trimmed = name.trim();
    if (trimmed && form.subjects.some((s) => s.name === trimmed)) {
      showNotification(`مادة ( ${trimmed} ) مضافة مسبقاً`, "info");
      return;
    }
    setForm((f) => {
      const subjects = [...f.subjects, { name: trimmed, currentScore: "", details: {}, isNew: true }];
      setOpenSubject(subjects.length - 1);
      return { ...f, subjects };
    });
  };

  const removeSubject = (index) => {
    const s = form.subjects[index];
    if (s.isNew) {
      setForm((f) => {
        const subjects = f.subjects.filter((_, i) => i !== index);
        return { ...f, subjects, ...calcTotals(subjects) };
      });
      setOpenSubject(null);
    } else {
      handleDeleteSavedSubject(s.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanSubjects = form.subjects
      .filter((s) => (s.name || "").trim())
      .map(({ isNew, ...s }) => ({
        ...s,
        name: s.name.trim(),
        currentScore: s.currentScore === "" || s.currentScore == null ? 0 : Number(s.currentScore),
        details: Object.fromEntries(
          Object.entries(s.details || {}).filter(([, v]) => v !== "" && v !== null && v !== undefined)
        ),
      }));

    const names = cleanSubjects.map((s) => s.name);
    if (new Set(names).size !== names.length) {
      showNotification("يوجد اسم مادة مكرر، يرجى تعديله", "error");
      return;
    }

    setLoading(true);
    try {
      const payload = { ...form, subjects: cleanSubjects };
      if (!payload.password) {
        delete payload.password;
      }
      const res = await api.put(`/admin/students/${student._id}`, payload);
      onUpdate(res.data);
      showNotification("تم حفظ بيانات الطالب ومواده", "success");
      onClose();
    } catch (err) {
      showNotification("فشل تحديث بيانات الطالب", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4 lg:p-6">
      <div className="bg-surface-container-lowest rounded-3xl oceanic-shadow w-full max-w-3xl max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-surface-variant flex items-center justify-between border-r-4 border-primary sticky top-0 z-10">
          <h3 className="text-xl font-bold font-headline">تعديل بيانات الطالب</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-container-high rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant mr-1">اسم الطالب</label>
            <input
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">اسم المستخدم</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow font-mono"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">تعديل رمز الدخول (اختياري)</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
                value={form.password}
                placeholder="••••••••"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">الصف</label>
              <select
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow text-sm"
                value={form.grade}
                onChange={(e) => setForm({ ...form, grade: e.target.value })}
              >
                {options.grades.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">القسم</label>
              <select
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow text-sm"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
              >
                {options.departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* ===== المواد والدرجات ===== */}
          <div className="space-y-4 p-5 bg-surface-container rounded-2xl">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">menu_book</span>
                المواد والدرجات ({form.subjects.length})
              </h4>
              <button
                type="button"
                onClick={() => addSubject("")}
                className="px-3 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                مادة جديدة
              </button>
            </div>

            <div>
              <p className="text-[10px] text-on-surface-variant font-bold mb-2">إضافة سريعة (اضغط على المادة):</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_SUBJECTS.map((name) => {
                  const exists = form.subjects.some((s) => s.name === name);
                  return (
                    <button
                      key={name}
                      type="button"
                      disabled={exists}
                      onClick={() => addSubject(name)}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold border transition-colors ${
                        exists
                          ? "bg-surface-container-high text-outline border-transparent cursor-not-allowed"
                          : "bg-white text-primary border-primary/30 hover:bg-primary/10"
                      }`}
                    >
                      {exists ? "✓ " : "+ "}
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {form.subjects.map((s, i) => (
                <div key={i} className="bg-white rounded-2xl border border-surface-container-high p-4 space-y-3">
                  <div className="flex items-end gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1">اسم المادة</label>
                      <input
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm font-bold"
                        value={s.name}
                        placeholder="مثال: الرياضيات"
                        onChange={(e) => updateSubject(i, { name: e.target.value })}
                      />
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-on-surface-variant mb-1">الدرجة النهائية</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm font-black text-center"
                        value={s.currentScore}
                        onChange={(e) => updateSubject(i, { currentScore: e.target.value }, true)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenSubject(openSubject === i ? null : i)}
                      className="p-2 text-outline hover:text-primary"
                      title="تفاصيل الدرجات"
                    >
                      <span className="material-symbols-outlined">{openSubject === i ? "expand_less" : "expand_more"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSubject(i)}
                      className="p-2 text-error hover:scale-110 transition-transform"
                      title="حذف المادة"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>

                  {openSubject === i && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-surface-container-high">
                      {DETAIL_FIELDS.map((f) => (
                        <div key={f.key}>
                          <label className="block text-[10px] font-bold text-on-surface-variant mb-1">{f.label}</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-full px-3 py-2 bg-surface-container-low rounded-lg text-sm text-center"
                            value={s.details?.[f.key] ?? (f.alt ? s.details?.[f.alt] : "") ?? ""}
                            onChange={(e) => setDetail(i, f.key, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {form.subjects.length === 0 && (
                <p className="text-xs text-outline italic text-center py-4">لا توجد مواد مسجلة. أضف مادة من الأزرار أعلاه.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">المعدل</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow font-bold"
                value={form.average}
                onChange={(e) => setForm({ ...form, average: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">المجموع</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow font-bold"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
              />
            </div>
          </div>
          <p className="text-[10px] text-outline -mt-3">يُحسب المجموع والمعدل تلقائياً عند تغيير درجات المواد، ويمكنك تعديلهما يدوياً.</p>

          <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary-container/20">
            <input
              type="checkbox"
              id="isPublished"
              className="w-5 h-5 accent-primary"
              checked={form.isPublished}
              onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            />
            <label htmlFor="isPublished" className="text-sm font-bold text-primary cursor-pointer">نشر النتيجة للطالب</label>
          </div>

          <div className="p-6 bg-surface-container rounded-2xl space-y-4">
            <h4 className="text-sm font-black flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">lock_reset</span>
              إعادة تعيين كلمة المرور
            </h4>
            <p className="text-[10px] text-on-surface-variant leading-relaxed">
              يمكنك إنشاء رابط مؤقت للطالب ليقوم بتعيين كلمة مرور جديدة بنفسه دون الحاجة لبريد إلكتروني.
            </p>

            {resetToken ? (
              <div className="space-y-2">
                <div className="p-3 bg-white rounded-xl border border-primary/20 break-all text-[10px] font-mono select-all">
                  {window.location.origin}/reset/{resetToken}
                </div>
                <p className="text-[9px] text-primary font-bold">انسخ هذا الرابط وأرسله للطالب. الرابط صالح لمدة ساعة واحدة.</p>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGenerateResetToken}
                disabled={loading}
                className="w-full py-2.5 bg-white border border-primary/20 text-primary text-xs font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">link</span>
                إنشاء رابط إعادة التعيين
              </button>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 academic-gradient text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {loading && <span className="material-symbols-outlined animate-spin text-sm">sync</span>}
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>
      </div>

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ ...confirm, isOpen: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
      />
    </div>
  );
}
