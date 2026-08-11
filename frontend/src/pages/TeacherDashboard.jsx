import Skeleton from "../components/Skeleton";
import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import * as XLSX from "xlsx";
import { useOptions } from "../context/OptionsContext";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";

export default function TeacherDashboard() {
  const { showNotification } = useNotification();
  const { options } = useOptions();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState(null);
  const [autoCreate, setAutoCreate] = useState(false);

  useEffect(() => {
    fetchData();
    if (options.grades.length) setSelectedGrade(options.grades[0]);
    if (options.departments.length) setSelectedDept(options.departments[0]);
    if (options.sections?.length) setSelectedSection(options.sections[0]);
  }, [options]);

  const fetchData = async () => {
    try {
      const res = await api.get("/auth/profile");
      setProfile(res.data);
      if (res.data.profile.subjects.length > 0) {
        setSubject(res.data.profile.subjects[0]);
      }

      const statsRes = await api.get("/admin/teacher-stats");
      setStats(statsRes.data);

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setPreviewData(null);
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!file || !subject || !selectedGrade || !selectedDept) {
        return showNotification("يرجى اختيار جميع البيانات للمعاينة", "info");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectName", subject);
    formData.append("grade", selectedGrade);
    formData.append("department", selectedDept);
    formData.append("section", selectedSection);

    setUploading(true);
    setUploadProgress(0);
    try {
      const res = await api.post("/admin/upload-preview", formData, {
          onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
          }
      });
      setPreviewData(res.data);
    } catch (err) {
      showNotification(err.response?.data?.message || "فشل معاينة الملف", "error");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleConfirm = async (publish = false) => {
      if (!previewData) return;
      setUploading(true);
      try {
          await api.post("/admin/confirm-upload", {
              students: previewData.students,
              isPublished: publish,
              subjectName: subject,
              autoCreate,
              grade: selectedGrade,
              department: selectedDept,
              section: selectedSection
          });
          showNotification(publish ? "تم نشر النتائج بنجاح" : "تم حفظ النتائج كمسودة", "success");
          setPreviewData(null);
          setFile(null);
          fetchData();
      } catch (err) {
          showNotification("فشل حفظ النتائج", "error");
      } finally {
          setUploading(false);
      }
  };

  if (loading) return (
      <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
          <div className="mb-10 space-y-4">
              <div className="h-10 bg-surface-container-high rounded-xl w-64 animate-pulse"></div>
              <div className="h-4 bg-surface-container-high rounded-xl w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-surface-container-high rounded-3xl animate-pulse"></div>)}
          </div>
          <div className="grid grid-cols-12 gap-8">
              <div className="col-span-12 lg:col-span-7 h-96 bg-surface-container-high rounded-3xl animate-pulse"></div>
              <div className="col-span-12 lg:col-span-5 h-96 bg-surface-container-high rounded-3xl animate-pulse"></div>
          </div>
      </main>
  );

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">لوحة تحكم المعلم</h2>
            <p className="text-on-surface-variant max-w-2xl">مرحباً {profile?.user?.name}. يمكنك رفع نتائج المواد المخصصة لك ومتابعة أداء الطلاب.</p>
          </div>
          <button onClick={() => window.print()} className="px-6 py-2.5 bg-white border border-surface-container shadow-sm rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-surface-container-low transition-all print:hidden">
            <span className="material-symbols-outlined text-sm">print</span>
            طباعة تقرير الأداء
          </button>
      </div>

      {/* Analytics */}
      {stats.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {stats.map((s, idx) => (
              <div key={idx} className={`bg-white p-6 rounded-3xl oceanic-shadow border-r-4 hover-lift ${s.passRate < 50 ? 'border-error' : 'border-primary'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-black text-lg text-on-surface">{s.subject}</h4>
                    {s.passRate < 50 && (
                        <span className="flex items-center gap-1 text-[10px] bg-error/10 text-error px-2 py-1 rounded-full font-bold">
                            <span className="material-symbols-outlined text-xs">warning</span>
                            تنبيه أداء
                        </span>
                    )}
                  </div>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-outline">متوسط الدرجات:</span>
                          <span className="font-bold">{s.average}%</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-outline">عدد الطلاب:</span>
                          <span className="font-bold">{s.totalStudents}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                          <span className="text-outline">نسبة النجاح:</span>
                          <span className={`font-bold ${s.passRate < 50 ? 'text-error' : 'text-green-600'}`}>{s.passRate}%</span>
                      </div>
                      {s.atRiskCount > 0 && (
                          <div className="flex justify-between items-center text-[10px] text-tertiary font-bold bg-tertiary/5 p-2 rounded-xl border border-tertiary/10">
                              <span>طلاب في منطقة الخطر:</span>
                              <span>{s.atRiskCount} طلاب</span>
                          </div>
                      )}
                      <div className="w-full bg-surface-container-low h-2 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full ${s.passRate < 50 ? 'bg-error' : 'bg-green-500'}`} style={{ width: `${s.passRate}%` }}></div>
                      </div>
                  </div>
              </div>
          ))}
      </div>
      ) : (
          <div className="bg-white rounded-3xl oceanic-shadow mb-10 border border-surface-container overflow-hidden">
              <EmptyState
                icon="monitoring"
                title="لا توجد بيانات تحليلية"
                message="بمجرد قيامك برفع نتائج المواد، ستظهر هنا إحصائيات الأداء ونسب النجاح لطلابك."
              />
          </div>
      )}

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-7 space-y-8">
          <div className="bg-surface-container-lowest rounded-3xl p-8 oceanic-shadow">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">upload_file</span>
              رفع نتائج مادة
            </h3>

            {!previewData ? (
                <form onSubmit={handlePreview} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold mb-2 mr-1">المادة</label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-surface-container-low px-4 py-3 rounded-2xl text-sm focus-glow"
                        >
                          {profile?.profile?.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-2 mr-1">الصف الدراسي</label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => setSelectedGrade(e.target.value)}
                          className="w-full bg-surface-container-low px-4 py-3 rounded-2xl text-sm focus-glow"
                        >
                          {options.grades.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                  </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2 mr-1">القسم</label>
                    <select
                      value={selectedDept}
                      onChange={(e) => setSelectedDept(e.target.value)}
                      className="w-full bg-surface-container-low px-4 py-3 rounded-2xl text-sm focus-glow"
                    >
                      {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2 mr-1">الشعبة</label>
                    <select
                      value={selectedSection}
                      onChange={(e) => setSelectedSection(e.target.value)}
                      className="w-full bg-surface-container-low px-4 py-3 rounded-2xl text-sm focus-glow"
                    >
                      {options.sections?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  </div>

                  <div className="border-2 border-dashed border-surface-container-highest rounded-3xl p-10 text-center hover:border-primary transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={handleFileChange}
                      accept=".xlsx, .xls"
                    />
                    <span className="material-symbols-outlined text-5xl text-outline mb-4">cloud_upload</span>
                    <p className="text-sm font-bold text-on-surface">{file ? file.name : "اضغط هنا لاختيار ملف Excel"}</p>
                  </div>

                  <div className="flex items-center gap-3 px-2">
                      <input
                          type="checkbox"
                          checked={autoCreate}
                          onChange={(e) => setAutoCreate(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-outline-variant accent-primary"
                      />
                      <span className="text-xs font-bold text-on-surface-variant">إنشاء حسابات للأسماء الجديدة تلقائياً</span>
                  </div>

                  {uploading && (
                      <div className="w-full bg-surface-container h-4 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                      </div>
                  )}

                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="w-full primary-gradient text-white py-4 rounded-2xl font-bold shadow-lg disabled:opacity-50"
                  >
                    {uploading ? `جاري الرفع... ${uploadProgress}%` : "تحميل ومعاينة"}
                  </button>
                </form>
            ) : (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-2xl">
                        <div>
                            <p className="text-[10px] font-bold uppercase text-outline">المادة المختارة</p>
                            <p className="font-black text-primary">{subject}</p>
                        </div>
                        <button onClick={() => setPreviewData(null)} className="text-xs font-bold text-outline hover:text-error">تغيير الملف</button>
                    </div>

                    {previewData.errors && previewData.errors.length > 0 && (
                        <div className="bg-warning/10 border border-warning/30 p-4 rounded-2xl">
                            <h4 className="text-xs font-black text-warning mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-sm">warning</span>
                                تم رصد بعض الملاحظات في الملف:
                            </h4>
                            <ul className="list-disc list-inside space-y-1">
                                {previewData.errors.map((err, i) => (
                                    <li key={i} className="text-[10px] font-bold text-on-surface-variant">{err}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="max-h-96 overflow-y-auto rounded-[2rem] border border-surface-container-high bg-white shadow-inner">
                        <table className="w-full text-right text-sm">
                            <thead className="bg-surface-container-low/50 sticky top-0 backdrop-blur-md">
                                <tr className="text-on-surface-variant font-black uppercase text-[10px] tracking-widest">
                                    <th className="px-6 py-4">اسم الطالب</th>
                                    <th className="px-6 py-4 text-left">الدرجة المستخرجة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-container">
                                {previewData.students.map((s, i) => (
                                    <tr key={i} className="hover:bg-primary/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-lg bg-surface-container-high flex items-center justify-center text-[10px] font-black group-hover:bg-primary group-hover:text-white transition-colors">
                                                    {i + 1}
                                                </div>
                                                <span className="font-bold">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <span className={`font-mono font-black text-lg ${s.score >= 50 ? 'text-primary' : 'text-error'}`}>
                                                {s.score}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-4">
                        <button
                          onClick={() => handleConfirm(false)}
                          disabled={uploading}
                          className="flex-1 py-4 bg-surface-container-high text-on-surface font-bold rounded-2xl"
                        >
                          حفظ كمسودة
                        </button>
                        <button
                          onClick={() => handleConfirm(true)}
                          disabled={uploading}
                          className="flex-[2] primary-gradient text-white py-4 rounded-2xl font-bold shadow-lg"
                        >
                          {uploading ? "جاري النشر..." : "نشر النتائج للطلاب"}
                        </button>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-5 space-y-8">
          <div className="bg-white rounded-3xl p-8 oceanic-shadow">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary">book</span>
              المواد المخصصة لك
            </h3>
            <div className="space-y-3">
              {profile?.profile?.subjects && profile.profile.subjects.length > 0 ? (
                profile.profile.subjects.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4 bg-surface-container-low rounded-2xl border border-surface-container">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">{idx + 1}</div>
                    <span className="font-bold">{s}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 opacity-60">
                   <span className="material-symbols-outlined text-4xl mb-2">assignment_late</span>
                   <p className="text-sm font-bold">لم يتم إسناد مواد لك بعد</p>
                   <p className="text-[10px]">يرجى مراجعة المسؤول لإضافة موادك الدراسية</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 oceanic-shadow border border-surface-container">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">download</span>
                    قوالب الرفع
                </h3>
                <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                    استخدم القالب الرسمي لضمان تعرف النظام على أسماء الطلاب ودرجاتهم بشكل صحيح.
                </p>
                <button
                    onClick={() => {
                        const data = [
                            ["اسم الطالب", "الدرجة", "ملاحظات"],
                            ["أحمد علي محمد", 85, ""],
                            ["سارة جاسم محمود", 92, ""]
                        ];
                        const ws = XLSX.utils.aoa_to_sheet(data);
                        const wb = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(wb, ws, "Template");
                        XLSX.writeFile(wb, "gradex_upload_template.xlsx");
                    }}
                    className="w-full py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-2xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-outlined">description</span>
                    تحميل نموذج Excel فارغ
                </button>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
