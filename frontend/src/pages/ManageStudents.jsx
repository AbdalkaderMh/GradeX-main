import { useNotification } from "../context/NotificationContext";
import Skeleton from "../components/Skeleton";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useSearch } from "../hooks/SearchContext";
import { useOptions } from "../context/OptionsContext";
import EditStudentModal from "../components/EditStudentModal";
import ConfirmModal from "../components/ConfirmModal";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";

export default function ManageStudents() {
  const { showNotification } = useNotification();
  const { options } = useOptions();
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, currentPage: 1, totalStudents: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [editingStudent, setEditingStudent] = useState(null);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { searchQuery } = useSearch();

  const [confirm, setConfirm] = useState({ isOpen: false, title: "", message: "", onConfirm: () => {} });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedGrade, selectedDept, selectedSection, searchQuery, page]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/students", {
        params: { grade: selectedGrade, department: selectedDept, section: selectedSection, search: searchQuery, page }
      });
      setStudents(res.data.students);
      setPagination({
        totalPages: res.data.totalPages,
        currentPage: res.data.currentPage,
        totalStudents: res.data.totalStudents
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirm({
      isOpen: true,
      title: "حذف طالب",
      message: "هل أنت متأكد من رغبتك في حذف هذا الطالب؟ سيتم حذف جميع بياناته ونتائجه بشكل نهائي.",
      onConfirm: async () => {
        try {
          await api.delete(`/admin/students/${id}`);
          setStudents(students.filter(s => s._id !== id));
          showNotification("تم حذف الطالب بنجاح", "success");
        } catch (err) {
          showNotification("فشل حذف الطالب", "error");
        }
      }
    });
  };

  const handleBulkPublish = (status) => {
    const action = status ? "نشر" : "إلغاء نشر";
    const affectedCount = students.filter(s => s.isPublished !== status).length;
    setConfirm({
      isOpen: true,
      title: `${action} النتائج`,
      message: `أنت على وشك ${action} نتائج لـ ${affectedCount} طالب في ( ${selectedGrade || 'الكل'} / ${selectedDept || 'الكل'} / ${selectedSection || 'الكل'} ). هل ترغب في الاستمرار؟`,
      onConfirm: async () => {
        setLoading(true);
        try {
          await api.post("/admin/bulk-publish", {
            grade: selectedGrade,
            department: selectedDept,
            section: selectedSection,
            isPublished: status
          });
          showNotification(`تم ${action} النتائج بنجاح`, "success");
          fetchStudents();
        } catch (err) {
          showNotification("فشل تحديث حالة النتائج", "error");
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get("/admin/export-students", {
        params: { grade: selectedGrade, department: selectedDept },
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `students_credentials_${selectedGrade || "all"}_${selectedDept || "all"}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showNotification("فشل تحميل البيانات", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="lg:mr-64 pt-24 pb-12 px-4 lg:px-10">
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">إدارة الطلاب والنتائج</h2>
          <p className="text-on-surface-variant max-w-2xl">استعراض وتعديل أو حذف بيانات الطلاب المسجلة في النظام.</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8">
        <aside className="col-span-12 lg:col-span-3 order-2 lg:order-1">
          <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="font-bold text-lg mb-6">تصفية النتائج</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">الصف الدراسي</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                >
                  <option value="">الكل</option>
                  {options.grades.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">القسم</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                >
                  <option value="">الكل</option>
                  {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant mb-2">الشعبة</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                >
                  <option value="">الكل</option>
                  {options.sections?.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-surface-container">
              <div className="flex justify-between items-center text-sm">
                <span className="text-on-surface-variant">إجمالي الطلاب:</span>
                <span className="font-bold">{pagination.totalStudents}</span>
              </div>
            </div>
          </section>

          <section className="bg-primary-container/10 border border-primary-container/20 rounded-2xl p-6">
              <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">publish</span>
                  عمليات جماعية
              </h3>
              <p className="text-[10px] text-on-primary-container/70 mb-6 leading-relaxed">تطبق هذه العمليات على الفلاتر المختارة حالياً.</p>

              <div className="space-y-3">
                  <button
                    onClick={() => handleBulkPublish(true)}
                    disabled={loading}
                    className="w-full py-3 bg-primary text-white font-bold rounded-xl text-xs shadow-md hover:bg-primary-dim transition-all flex items-center justify-center gap-2"
                  >
                      <span className="material-symbols-outlined text-sm">visibility</span>
                      نشر كافة النتائج
                  </button>
                  <button
                    onClick={() => handleBulkPublish(false)}
                    disabled={loading}
                    className="w-full py-3 bg-white border border-outline/20 text-on-surface-variant font-bold rounded-xl text-xs hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
                  >
                      <span className="material-symbols-outlined text-sm">visibility_off</span>
                      إلغاء النشر للكل
                  </button>
              </div>
          </section>
        </aside>

        <section className="col-span-12 lg:col-span-9 bg-surface-container-lowest rounded-3xl overflow-hidden oceanic-shadow order-1 lg:order-2 border border-surface-container">
          <div className="px-6 lg:px-8 py-6 bg-surface-container-low flex flex-row-reverse items-center justify-between border-b border-surface-container">
            <div className="flex items-center gap-4 flex-row-reverse">
              <span className="material-symbols-outlined text-primary">people</span>
              <h3 className="text-2xl font-bold font-headline">قائمة الطلاب</h3>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-xl font-bold text-sm oceanic-shadow border border-primary/20 hover:bg-primary hover:text-white transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">{exporting ? "sync" : "download"}</span>
              <span>{exporting ? "جاري التحميل..." : "تحميل بيانات الدخول (Excel)"}</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right min-w-[600px]">
              <thead>
                <tr className="bg-surface-container-low/50 text-on-surface-variant text-sm font-medium">
                  <th className="px-6 py-4">اسم الطالب</th>
                  <th className="px-6 py-4">رمز الدخول</th>
                  <th className="px-6 py-4">الصف والشعبة</th>
                  <th className="px-6 py-4">القسم والمواد</th>
                  <th className="px-6 py-4">المعدل</th>
                  <th className="px-6 py-4">الترتيب</th>
                  <th className="px-6 py-4">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-32"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-20"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-28"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-12"></div></td>
                      <td className="px-6 py-4"><div className="h-8 bg-surface-container-high rounded w-16"></div></td>
                    </tr>
                  ))
                ) : students.map((s) => (
                  <tr key={s._id} className="hover:bg-primary/5 transition-all group">
                    <td className="px-6 py-4 font-bold group-hover:text-primary transition-colors">{s.name}</td>
                    <td className="px-6 py-4">
                        <div className="font-mono text-sm font-bold text-primary">{s.username}</div>
                        {s.requiresPasswordChange && (
                            <div className="text-[10px] text-tertiary font-bold flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-[12px]">key</span>
                                رمز الدخول: {s.username}
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold">
                        {s.grade}
                        <div className="text-[10px] text-on-surface-variant opacity-60">شعبة ({s.section || 'أ'})</div>
                    </td>
                    <td className="px-6 py-4">
                        <div className="text-xs font-bold text-primary mb-1">{s.department}</div>
                        <div className="flex flex-wrap gap-1">
                            {s.subjects?.map((sub, i) => (
                                <span key={i} className="text-[9px] bg-surface-container px-1.5 py-0.5 rounded-md border border-surface-container-high" title={sub.currentScore}>
                                    {sub.name}
                                </span>
                            ))}
                        </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">{s.average}</td>
                    <td className="px-6 py-4 font-bold text-tertiary">#{s.rank}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                          title="تعديل الطالب"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          onClick={() => handleDelete(s._id)}
                          className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                          title="حذف الطالب"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && students.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-10">
                        <EmptyState
                            icon="person_search"
                            title="لا يوجد نتائج"
                            message="لم نتمكن من العثور على أي طلاب مطابقين لمعايير البحث أو الفلترة المختارة."
                        />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-6 border-t border-surface-container">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 disabled:opacity-30 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <span className="text-sm font-bold">صفحة {page} من {pagination.totalPages}</span>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 disabled:opacity-30 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            </div>
          )}
        </section>
      </div>

      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onUpdate={(updated) => {
            setStudents(students.map(s => s._id === updated._id ? updated : s));
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirm.isOpen}
        onClose={() => setConfirm({ ...confirm, isOpen: false })}
        onConfirm={confirm.onConfirm}
        title={confirm.title}
        message={confirm.message}
      />
      <Footer />
    </main>
  );
}
