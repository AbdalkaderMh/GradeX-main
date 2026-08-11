import { useState, useEffect } from "react";
import api from "../api/axios";
import * as XLSX from "xlsx";
import Footer from "../components/Footer";
import { useNotification } from "../context/NotificationContext";
import { useOptions } from "../context/OptionsContext";

export default function AdminDashboard() {
  const { showNotification } = useNotification();
  const { options } = useOptions();
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [resultTitle, setResultTitle] = useState("");
  const [uploadStatus, setUploadStatus] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [isBulkCreating, setIsBulkCreating] = useState(false);
  const [bulkPreview, setBulkPreview] = useState(null);
  const [autoCreate, setAutoCreate] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchStats();
    if (options.grades.length) setSelectedGrade(options.grades[0]);
    if (options.departments.length) setSelectedDept(options.departments[0]);
    if (options.sections?.length) setSelectedSection(options.sections[0]);
  }, [options]);

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/stats");
      setStats(res.data);
    } catch (err) { console.error(err); }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
  };

  const handleUploadPreview = async () => {
    if (!file) {
      showNotification("يرجى اختيار ملف أولاً", "info");
      return;
    }
    setLoading(true);
    try {
      setPreviewData(null);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("grade", selectedGrade);
      formData.append("department", selectedDept);
      formData.append("section", selectedSection);
      formData.append("subjectName", subjectName);
      formData.append("resultTitle", resultTitle);

      const res = await api.post("/admin/upload-preview", formData, {
          onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
          }
      });
      setPreviewData(res.data);

      if (res.data.meta.grade) setSelectedGrade(res.data.meta.grade);
      if (res.data.meta.department) setSelectedDept(res.data.meta.department);

    } catch (err) {
      const data = err.response?.data;
      if (data?.inferred) {
          if (data.inferred.grade) setSelectedGrade(data.inferred.grade);
          if (data.inferred.department) setSelectedDept(data.inferred.department);
          showNotification("يرجى التأكد من البيانات المختارة وإعادة المحاولة", "error");
      } else {
        showNotification(data?.message || "حدث خطأ أثناء رفع الملف", "error");
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleBulkCreatePreview = async () => {
      if (!file) return showNotification("يرجى اختيار ملف أولاً", "info");
      setLoading(true);
      try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await api.post("/admin/bulk-create-preview", formData);
          setBulkPreview(res.data);
          if (res.data.meta.grade) setSelectedGrade(res.data.meta.grade);
          if (res.data.meta.department) setSelectedDept(res.data.meta.department);
      } catch (err) {
          showNotification("فشل معاينة الملف", "error");
      } finally {
          setLoading(false);
      }
  };

  const handleBulkCreateAccounts = async () => {
    if (!bulkPreview) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("grade", selectedGrade);
      formData.append("department", selectedDept);

      const res = await api.post("/admin/bulk-create-students", formData);
      showNotification(`${res.data.message} - تم إنشاء: ${res.data.created}, موجود مسبقاً: ${res.data.existing}`, "success");

      if (res.data.accounts && res.data.accounts.length > 0) {
        const credentialsData = res.data.accounts.map(acc => ({
          "الاسم": acc.name,
          "اسم المستخدم": acc.username,
          "رمز الدخول": acc.entryKey
        }));
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(credentialsData);
        XLSX.utils.book_append_sheet(wb, ws, "New Credentials");
        XLSX.writeFile(wb, `new_students_${selectedGrade || 'inferred'}_${selectedDept || 'inferred'}.xlsx`);
      }

      setFile(null);
      fetchStats();
    } catch (err) {
      showNotification(err.response?.data?.message || "فشل إنشاء الحسابات", "error");
    } finally {
      setLoading(false);
      setIsBulkCreating(false);
    }
  };

  const handleDownloadCredentials = async () => {
    try {
      const res = await api.get("/admin/export-students", {
        params: { grade: selectedGrade, department: selectedDept },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_credentials.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      showNotification("فشل تحميل ملف البيانات", "error");
    }
  };

  const handleConfirmUpload = async (publish = false) => {
    if (!previewData || !previewData.students.length) return;
    setLoading(true);
    try {
      const res = await api.post("/admin/confirm-upload", {
        students: previewData.students,
        isPublished: publish,
        subjectName: previewData.summary.subjectName,
        autoCreate,
        grade: selectedGrade,
        department: selectedDept,
        section: selectedSection
      });

      setUploadStatus(res.data);
      setPreviewData(null);
      setFile(null);
      fetchStats();
    } catch (err) {
      showNotification("فشل تأكيد الرفع", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="lg:mr-64 pt-20 lg:pt-24 pb-12 px-4 lg:px-10">
      {/* Analytics Summary */}
      {!previewData && stats && (
        <>
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10 text-right">
          <div className="bg-white p-6 rounded-3xl oceanic-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">people</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">إجمالي الطلاب</p>
              <h5 className="text-2xl font-black">{stats.totalStudents}</h5>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl oceanic-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">verified</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">النتائج المنشورة</p>
              <h5 className="text-2xl font-black">{stats.publishedCount}</h5>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl oceanic-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-tertiary-container/30 rounded-2xl flex items-center justify-center text-tertiary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">متوسط الأداء</p>
              <h5 className="text-2xl font-black">
                {stats?.grades?.length > 0 ? (stats.grades.reduce((a, b) => a + (b.avg || 0), 0) / stats.grades.length).toFixed(1) : 0}%
              </h5>
            </div>
          </div>
          <div className="bg-white p-6 rounded-3xl oceanic-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <span className="material-symbols-outlined">school</span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-tighter">الصفوف الدراسية</p>
              <h5 className="text-2xl font-black">{stats.grades.length}</h5>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-12 lg:col-span-8 bg-white rounded-3xl p-8 oceanic-shadow border border-surface-container overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">monitoring</span>
                        تحليل الأداء العام
                    </h3>
                    <button onClick={() => window.print()} className="p-1.5 bg-surface-container-high rounded-lg text-on-surface-variant hover:text-primary transition-colors print:hidden">
                        <span className="material-symbols-outlined text-sm">print</span>
                    </button>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] font-bold text-on-surface-variant">
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-primary rounded-full"></span> متوسط الدرجات</div>
                    <div className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> نسبة النجاح</div>
                  </div>
                </div>

                <div className="relative h-64 flex items-end justify-between gap-4 px-4 pb-8 border-b border-surface-container">
                    {stats.grades.map((g, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                            {/* Value tooltips */}
                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-on-surface text-surface text-[10px] py-1 px-2 rounded-lg pointer-events-none z-10 whitespace-nowrap">
                              النجاح: {g.passRate}% | المتوسط: {g.avg}%
                            </div>

                            <div className="w-full flex items-end justify-center gap-1 h-48">
                                <div
                                  className="w-3 sm:w-6 bg-primary/20 rounded-t-lg relative group-hover:bg-primary/30 transition-all"
                                  style={{ height: `${g.avg}%` }}
                                >
                                  <div className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-1000" style={{ height: '100%' }}></div>
                                </div>
                                <div
                                  className="w-3 sm:w-6 bg-green-500/20 rounded-t-lg relative group-hover:bg-green-500/30 transition-all"
                                  style={{ height: `${g.passRate}%` }}
                                >
                                  <div className="absolute bottom-0 left-0 right-0 bg-green-500 rounded-t-lg transition-all duration-1000" style={{ height: '100%' }}></div>
                                </div>
                            </div>
                            <span className="text-[10px] font-black text-on-surface-variant truncate w-full text-center">{g.grade}</span>
                        </div>
                    ))}
                    {(!stats.grades || stats.grades.length === 0) && (
                      <div className="absolute inset-0 flex items-center justify-center text-on-surface-variant opacity-30 italic text-sm">
                        لا توجد بيانات كافية للرسم البياني
                      </div>
                    )}
                </div>

                <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.grades.slice(0, 4).map((g, i) => (
                    <div key={i} className="p-3 bg-surface-container-low rounded-2xl border border-surface-container">
                      <p className="text-[10px] text-on-surface-variant font-bold mb-1 truncate">{g.grade}</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-primary">{g.avg}%</span>
                        <span className="text-[8px] text-green-600 font-bold">({g.passRate}% نجاح)</span>
                      </div>
                    </div>
                  ))}
                </div>
            </div>

            <div className="col-span-12 lg:col-span-4 bg-white rounded-3xl p-8 oceanic-shadow border border-surface-container">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary">history</span>
                    آخر النشاطات
                </h3>
                <div className="space-y-4">
                    {stats.recentActivity?.map((act, i) => (
                        <div key={i} className="flex items-start gap-4 p-3 hover:bg-surface-container-low rounded-2xl transition-colors">
                            <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary shrink-0">
                                <span className="material-symbols-outlined text-sm">notifications</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold">{act.title}</p>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">للطالب: {act.student}</p>
                                <p className="text-[8px] text-outline mt-1">{new Date(act.time).toLocaleString('ar-EG')}</p>
                            </div>
                        </div>
                    ))}
                    {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                        <div className="text-center py-10 opacity-40">
                             <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                             <p className="text-xs font-bold">لا يوجد نشاطات مؤخراً</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
      )}

      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-on-surface/40 backdrop-blur-md">
            <div className="w-24 h-24 relative mb-6">
                <div className="absolute inset-0 border-8 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-8 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-center">
                <h3 className="text-2xl font-black text-white mb-2">جاري المعالجة...</h3>
                <p className="text-white/70 font-bold">يرجى الانتظار، يتم تحليل ملف البيانات وتحضيره للمراجعة</p>
            </div>
        </div>
      )}

      {uploadStatus && (
        <div className="mb-8 p-6 bg-tertiary-container/20 rounded-2xl flex items-center justify-between oceanic-shadow border-r-4 border-tertiary animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary-container">
              <span className="material-symbols-outlined">check_circle</span>
            </div>
            <div>
              <h4 className="font-bold text-lg text-on-tertiary-container">تمت العملية بنجاح!</h4>
              <p className="text-sm text-on-tertiary-container/80">
                تم حفظ <span className="font-bold">{uploadStatus.saved}</span> سجل جديد، وتم تخطي <span className="font-bold">{uploadStatus.skipped}</span> سجلات موجودة مسبقاً.
              </p>
            </div>
          </div>
          <button
            onClick={() => setUploadStatus(null)}
            className="p-2 hover:bg-tertiary-container/40 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-on-tertiary-container">close</span>
          </button>
        </div>
      )}

      <div className="mb-8 lg:mb-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="w-full lg:w-auto">
          <h2 className="text-2xl lg:text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">رفع نتائج الاختبارات</h2>
          <p className="text-on-surface-variant max-w-2xl text-xs lg:text-base">يرجى رفع ملفات النتائج (Excel أو CSV) لمراجعتها ونشرها للطلاب.</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
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
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
            title="تحميل نموذج Excel لرفع الدرجات"
          >
            <span className="material-symbols-outlined text-sm">download_for_offline</span>
            <span className="hidden sm:inline">نموذج الرفع</span>
          </button>
          <button
            onClick={() => setIsBulkCreating(true)}
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-xl bg-tertiary/10 text-tertiary font-bold hover:bg-tertiary/20 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_add</span>
            <span className="hidden sm:inline">إنشاء حسابات طلاب</span>
            <span className="sm:hidden text-xs text-nowrap">حسابات</span>
          </button>
          <button
            onClick={handleDownloadCredentials}
            className="flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-xl bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline text-nowrap">بيانات الدخول</span>
            <span className="sm:hidden text-xs text-nowrap">تصدير</span>
          </button>
          <button
            onClick={() => handleConfirmUpload(false)}
            disabled={loading || !previewData}
            className={`flex-1 lg:flex-none px-4 lg:px-6 py-2 rounded-xl bg-surface-container-high text-on-surface font-semibold hover:bg-surface-container-highest transition-colors disabled:opacity-50 text-xs sm:text-sm text-nowrap`}
          >
            مسودة
          </button>
          <button
            onClick={() => handleConfirmUpload(true)}
            disabled={loading || !previewData}
            className={`flex-[2] lg:flex-none px-4 lg:px-8 py-2 rounded-xl academic-gradient text-white font-bold shadow-lg flex items-center justify-center gap-2 ${(!previewData || loading) ? 'opacity-50 cursor-not-allowed' : ''} text-xs sm:text-sm text-nowrap`}
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
            <span>{loading ? "جاري المعالجة..." : "نشر النتائج"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-8">
          <section className="bg-surface-container-lowest rounded-2xl p-1 shadow-sm">
            <div className="border-2 border-dashed border-outline-variant rounded-xl p-6 lg:p-12 flex flex-col items-center justify-center transition-all hover:border-primary/40 hover:bg-surface-container-low relative text-center">
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileChange}
                accept=".xlsx, .xls"
              />
              <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-surface-container-high flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl lg:text-4xl text-on-surface-variant">upload_file</span>
              </div>
              <h3 className="text-lg lg:text-xl font-bold mb-2">
                {file ? file.name : "اسحب وأفلت ملف النتائج هنا"}
              </h3>
              <p className="text-on-surface-variant mb-6 text-sm lg:text-base">يدعم ملفات Excel حتى 50 ميجابايت.</p>
              <button
                onClick={handleUploadPreview}
                disabled={loading || !file}
                className="px-6 py-2 bg-primary text-white rounded-lg font-medium relative z-10"
              >
                {loading ? `جاري الرفع... ${uploadProgress}%` : "تحميل ومعاينة"}
              </button>
            </div>
          </section>

          <div className="grid grid-cols-12 gap-8">
            <aside className="col-span-12 lg:col-span-4">
              <section className="bg-surface-container-lowest rounded-2xl p-6 shadow-sm h-full">
                <h3 className="font-bold text-lg mb-6">إعدادات الملف</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2">الصف الدراسي</label>
                    <select
                      value={selectedGrade}
                      onChange={(e) => setSelectedGrade(e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                    >
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
                      {options.sections?.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2">اسم المادة (اختياري)</label>
                    <input
                      type="text"
                      placeholder="مثلاً: الرياضيات"
                      value={subjectName}
                      onChange={(e) => setSubjectName(e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                    />
                    <p className="text-[10px] text-on-surface-variant mt-1 italic">استخدمه إذا كان الملف لمادة واحدة فقط.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant mb-2">عنوان النتيجة</label>
                    <input
                      type="text"
                      placeholder="مثلاً: نتائج شهر أكتوبر"
                      value={resultTitle}
                      onChange={(e) => setResultTitle(e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg text-sm p-2 focus-glow"
                    />
                  </div>

                  <div className="pt-2">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={autoCreate}
                                onChange={(e) => setAutoCreate(e.target.checked)}
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-low checked:bg-primary checked:border-primary transition-all"
                            />
                            <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-sm font-bold right-0.5 pointer-events-none">check</span>
                        </div>
                        <span className="text-xs font-bold text-on-surface-variant group-hover:text-primary transition-colors">إنشاء حسابات للأسماء الجديدة تلقائياً</span>
                      </label>
                  </div>
                </div>

                {previewData && (
                  <div className="mt-8 pt-6 border-t border-surface-container">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">إجمالي السجلات المستخرجة:</span>
                      <span className="font-bold">{previewData.students.length}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-on-surface-variant">السنة الأكاديمية:</span>
                      <span className="font-bold">{previewData.meta.academicYear || "غير محدد"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="text-on-surface-variant">الشعبة:</span>
                      <span className="font-bold">{previewData.meta.section || "غير محدد"}</span>
                    </div>
                  </div>
                )}
              </section>
            </aside>

            <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 lg:px-8 py-6 bg-surface-variant flex flex-row-reverse items-center justify-between border-r-4 border-primary">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary">fact_check</span>
                  <h3 className="text-xl lg:text-2xl font-bold font-headline">معاينة البيانات</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-on-surface-variant hidden sm:inline">
                    {previewData ? `تم استيراد ${previewData.students.length} سجل` : "لا توجد بيانات"}
                  </span>
                  <button onClick={handleUploadPreview} className="p-2 hover:bg-surface-container-high rounded-lg">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right min-w-[600px]">
                  <thead>
                    <tr className="bg-surface-container-low/50 text-on-surface-variant text-sm font-medium">
                      <th className="px-6 py-4 text-right">اسم المستخدم</th>
                      <th className="px-6 py-4 text-right">رمز الدخول</th>
                      <th className="px-6 py-4 text-right">الاسم الكامل</th>
                      <th className="px-6 py-4 text-right">المواد المسندة</th>
                      <th className="px-6 py-4 text-right">المعدل</th>
                      <th className="px-6 py-4 text-right">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-container">
                    {previewData?.students.slice(0, 10).map((s, idx) => (
                      <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                        <td className="px-6 py-4 font-mono text-sm text-primary font-bold">{s.username}</td>
                        <td className="px-6 py-4 font-mono text-sm">{s.studentKey}</td>
                        <td className="px-6 py-4 font-bold">{s.name}</td>
                        <td className="px-6 py-4">
                           <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {s.subjects.map((sub, i) => (
                                <span key={i} className="text-[10px] bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full font-bold" title={sub.grade}>
                                  {sub.name}
                                </span>
                              ))}
                           </div>
                        </td>
                        <td className="px-6 py-4">{s.average}</td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setEditingStudent({ ...s, _idx: idx })}
                            className="text-primary text-sm font-bold hover:underline"
                          >
                            تعديل
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!previewData && (
                       <tr>
                         <td colSpan="6" className="px-6 py-10 text-center text-on-surface-variant opacity-50">يرجى رفع ملف للمعاينة</td>
                       </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {previewData && previewData.students.length > 5 && (
                <div className="p-4 border-t border-surface-container bg-surface-container-lowest text-center">
                  <button className="text-sm text-primary font-medium">عرض جميع السجلات ({previewData.students.length})</button>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      {isBulkCreating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4 lg:p-6">
          <div className="bg-surface-container-lowest rounded-3xl oceanic-shadow w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-8 py-6 bg-tertiary text-white flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold font-headline">إنشاء حسابات من ملف Excel</h3>
              <button onClick={() => { setIsBulkCreating(false); setBulkPreview(null); }} className="p-2 hover:bg-white/20 rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <p className="text-sm text-on-surface-variant leading-relaxed">
                سيتم استخراج كافة الأسماء من الملف وإنشاء حسابات دخول جديدة لها. الأسماء المسجلة مسبقاً سيتم تخطيها.
              </p>

              <div className="space-y-6">
                <div className="p-6 bg-surface-container-low rounded-2xl border-2 border-dashed border-outline-variant text-center">
                   <p className="text-sm font-bold truncate mb-4">{file ? file.name : "لم يتم اختيار ملف"}</p>
                   {!bulkPreview && (
                       <button
                        onClick={handleBulkCreatePreview}
                        disabled={loading || !file}
                        className="px-6 py-2 bg-tertiary text-white rounded-xl font-bold text-sm"
                       >
                           {loading ? "جاري المعالجة..." : "معاينة الأسماء المستخرجة"}
                       </button>
                   )}
                </div>

                {bulkPreview && (
                   <div className="animate-in fade-in slide-in-from-top-4">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold mb-1">الصف المستهدف</label>
                                <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-full p-3 bg-surface-container rounded-xl text-sm font-bold">
                                    {options.grades.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1">القسم المستهدف</label>
                                <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="w-full p-3 bg-surface-container rounded-xl text-sm font-bold">
                                    {options.departments.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="bg-surface-container-low rounded-xl overflow-hidden border border-surface-container-high">
                            <table className="w-full text-right text-xs">
                                <thead className="bg-surface-container-high">
                                    <tr>
                                        <th className="px-4 py-3">الاسم المستخرج</th>
                                        <th className="px-4 py-3">الحالة</th>
                                        <th className="px-4 py-3 text-left">اسم المستخدم</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-container-high">
                                    {bulkPreview.students.slice(0, 50).map((s, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3 font-bold">{s.name}</td>
                                            <td className="px-4 py-3">
                                                {s.exists ?
                                                    <span className="text-primary font-bold">مسجل مسبقاً</span> :
                                                    <span className="text-green-600 font-bold">جديد</span>
                                                }
                                            </td>
                                            <td className="px-4 py-3 font-mono text-left opacity-60">{s.username}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {bulkPreview.students.length > 50 && (
                                <div className="p-3 bg-surface-container-high text-center font-bold opacity-60">
                                    + {bulkPreview.students.length - 50} أسماء أخرى في الملف
                                </div>
                            )}
                        </div>
                   </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-surface-container border-t border-surface-container-high flex gap-4 shrink-0">
                <button
                  onClick={() => { setIsBulkCreating(false); setBulkPreview(null); }}
                  className="flex-1 py-3 font-bold text-on-surface-variant hover:bg-surface-container-highest rounded-xl transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleBulkCreateAccounts}
                  disabled={loading || !bulkPreview}
                  className="flex-[2] py-3 bg-tertiary text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {loading ? "جاري المعالجة..." : `تأكيد إنشاء ${bulkPreview?.students.filter(s => !s.exists).length || 0} حساب جديد`}
                </button>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4 lg:p-6">
          <div className="bg-surface-container-lowest rounded-3xl oceanic-shadow w-full max-w-lg overflow-hidden">
            <div className="px-8 py-6 bg-surface-variant flex items-center justify-between border-r-4 border-primary">
              <h3 className="text-xl font-bold font-headline">تعديل بيانات المعاينة</h3>
              <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-surface-container-high rounded-full">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-6 lg:p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-bold text-on-surface-variant mr-1">اسم الطالب</label>
                <input
                  className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant mr-1">المعدل</label>
                  <input
                    type="number"
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
                    value={editingStudent.average}
                    onChange={(e) => setEditingStudent({...editingStudent, average: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-on-surface-variant mr-1">رمز الدخول</label>
                  <input
                    className="w-full px-4 py-3 bg-surface-container-low rounded-xl focus-glow"
                    value={editingStudent.studentKey}
                    onChange={(e) => setEditingStudent({...editingStudent, studentKey: e.target.value})}
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  const newStudents = [...previewData.students];
                  newStudents[editingStudent._idx] = { ...editingStudent };
                  setPreviewData({ ...previewData, students: newStudents });
                  setEditingStudent(null);
                }}
                className="w-full py-4 academic-gradient text-white font-bold rounded-xl shadow-lg"
              >
                تحديث في المعاينة
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-12 p-6 bg-surface-container-high rounded-2xl flex flex-col lg:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-on-surface-variant">info</span>
          <p className="text-xs lg:text-sm text-on-surface-variant font-medium text-center lg:text-right">يرجى التأكد من صحة البيانات قبل النشر النهائي. لا يمكن التراجع بعد النشر.</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button
            onClick={() => setPreviewData(null)}
            className="flex-1 lg:flex-none px-6 py-3 text-on-surface-variant font-bold hover:bg-surface-container-highest rounded-xl transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={() => handleConfirmUpload(true)}
            disabled={loading || !previewData}
            className={`flex-1 lg:flex-none px-8 py-3 academic-gradient text-white font-bold rounded-xl shadow-xl flex items-center justify-center gap-2 ${(!previewData || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? <span className="material-symbols-outlined animate-spin text-sm">sync</span> : null}
            <span className="text-sm lg:text-base">تأكيد ونشر النتائج</span>
          </button>
        </div>
      </div>

      <Footer />
    </main>
  );
}
