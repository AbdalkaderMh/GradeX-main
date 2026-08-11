import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import ConfirmModal from "./ConfirmModal";

export default function EditStudentModal({ student, onClose, onUpdate }) {
  const { showNotification } = useNotification();
  const [form, setForm] = useState({ ...student, password: "" });
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
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

  const handleDeleteSubject = (subjectName) => {
    setConfirm({
      isOpen: true,
      title: "حذف مادة",
      message: `هل أنت متأكد من حذف مادة ( ${subjectName} ) لهذا الطالب؟ سيتم إعادة احتساب المعدل والمجموع تلقائياً.`,
      onConfirm: async () => {
        try {
            setLoading(true);
            const res = await api.delete(`/admin/students/${student._id}/subjects/${subjectName}`);
            setForm(f => ({ ...f, subjects: f.subjects.filter(s => s.name !== subjectName), total: res.data.total, average: res.data.average }));
            showNotification("تم حذف المادة بنجاح", "success");
        } catch (err) {
            showNotification("فشل حذف المادة", "error");
        } finally {
            setLoading(false);
        }
      }
    });
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put(`/admin/students/${student._id}`, form);
      onUpdate(res.data);
      onClose();
    } catch (err) {
      showNotification("فشل تحديث بيانات الطالب", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-6">
      <div className="bg-surface-container-lowest rounded-3xl oceanic-shadow w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-6 bg-surface-variant flex items-center justify-between border-r-4 border-primary">
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
              onChange={(e) => setForm({...form, name: e.target.value})}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">اسم المستخدم</label>
              <input
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow font-mono"
                value={form.username}
                onChange={(e) => setForm({...form, username: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">تعديل رمز الدخول (اختياري)</label>
              <input
                type="password"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
                value={form.password}
                placeholder="••••••••"
                onChange={(e) => setForm({...form, password: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">الصف</label>
              <select
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow text-sm"
                value={form.grade}
                onChange={(e) => setForm({...form, grade: e.target.value})}
              >
                {options.grades.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">القسم</label>
              <select
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow text-sm"
                value={form.department}
                onChange={(e) => setForm({...form, department: e.target.value})}
              >
                {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">المواد المسجلة</label>
              <div className="flex flex-wrap gap-2">
                  {form.subjects?.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-surface-container-highest group">
                          <span className="text-xs font-bold">{s.name} ({s.currentScore})</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteSubject(s.name)}
                            className="text-error hover:scale-110 transition-transform flex items-center"
                          >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                          </button>
                      </div>
                  ))}
                  {(!form.subjects || form.subjects.length === 0) && <p className="text-[10px] text-outline italic">لا توجد مواد مسجلة</p>}
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
                onChange={(e) => setForm({...form, average: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-bold text-on-surface-variant mr-1">المجموع</label>
              <input
                type="number"
                className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow font-bold"
                value={form.total}
                onChange={(e) => setForm({...form, total: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-primary-container/10 rounded-2xl border border-primary-container/20">
            <input
              type="checkbox"
              id="isPublished"
              className="w-5 h-5 accent-primary"
              checked={form.isPublished}
              onChange={(e) => setForm({...form, isPublished: e.target.checked})}
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
