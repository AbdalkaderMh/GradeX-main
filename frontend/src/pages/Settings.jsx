import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import ImageUploadModal from "../components/ImageUploadModal";
import { resolveImageUrl } from "../utils/url";

export default function SettingsPage() {
  const { showNotification } = useNotification();
  const { refreshSettings } = useAuth();
  const [settings, setSettings] = useState({
    grades: [],
    departments: [],
    sections: [],
    activeScoringSystem: "average",
    maxTotal: 100,
    isCertificateEnabled: false,
    schoolName: "",
    logo: "",
    developerName: "",
    currentRound: "الأول",
    academicYear: "2025 - 2026",
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("general");
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);

  useEffect(() => {
    api.get("/admin/options").then((res) => {
      setSettings(res.data);
      setLoading(false);
    });
  }, []);

  const handleUpdate = async () => {
    try {
      await api.put("/admin/options", settings);
      await refreshSettings();
      showNotification("تم تحديث الإعدادات بنجاح", "success");
    } catch (err) {
      showNotification("فشل تحديث الإعدادات", "error");
    }
  };

  const removeItem = (key, index) => {
    const updated = [...settings[key]];
    updated.splice(index, 1);
    setSettings({ ...settings, [key]: updated });
  };

  const [newItem, setNewItem] = useState({ key: "", value: "" });

  const handleAddItem = (key) => {
    if (newItem.value.trim()) {
      setSettings({ ...settings, [key]: [...settings[key], newItem.value.trim()] });
      setNewItem({ key: "", value: "" });
    }
  };

  const handleLogoUpload = async (blob) => {
    const formData = new FormData();
    formData.append("logo", blob);
    try {
        const res = await api.post("/admin/upload-logo", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        setSettings({ ...settings, logo: res.data.logo });
        await refreshSettings();
        showNotification("تم تحديث شعار المنصة بنجاح", "success");
    } catch (err) {
        showNotification("فشل في رفع الشعار", "error");
    }
  };

  if (loading) return (
    <main className="lg:mr-64 pt-24 px-8 pb-12 min-h-screen flex items-center justify-center">
        <div className="text-xl font-bold animate-pulse text-primary">جاري تحميل الإعدادات...</div>
    </main>
  );

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen bg-surface-container-lowest/10">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
                <h2 className="text-3xl font-black font-headline text-on-surface">إعدادات النظام</h2>
                <p className="text-on-surface-variant font-bold mt-1">تخصيص الخيارات الأساسية للمنصة</p>
            </div>
            <button onClick={handleUpdate} className="px-8 py-3 academic-gradient text-white font-bold rounded-2xl shadow-lg hover:scale-105 transition-transform">
                حفظ كافة التغييرات
            </button>
        </div>

        <div className="glass-card rounded-[2.5rem] oceanic-shadow overflow-hidden border border-white/60">
            <div className="flex border-b border-surface-container bg-surface-container-low/30 backdrop-blur-md">
                <button onClick={() => setTab("general")} className={`flex-1 py-6 font-bold text-sm flex items-center justify-center gap-2 transition-all ${tab === "general" ? "text-primary bg-white/60 shadow-[0_-4px_0_inset_var(--color-primary)]" : "text-on-surface-variant hover:bg-white/40"}`}>
                    <span className="material-symbols-outlined">settings_suggest</span>
                    خيارات عامة
                </button>
                <button onClick={() => setTab("scoring")} className={`flex-1 py-6 font-bold text-sm flex items-center justify-center gap-2 transition-all ${tab === "scoring" ? "text-primary bg-white/60 shadow-[0_-4px_0_inset_var(--color-primary)]" : "text-on-surface-variant hover:bg-white/40"}`}>
                    <span className="material-symbols-outlined">calculate</span>
                    نظام الدرجات
                </button>
                <button onClick={() => setTab("advanced")} className={`flex-1 py-6 font-bold text-sm flex items-center justify-center gap-2 transition-all ${tab === "advanced" ? "text-primary bg-white/60 shadow-[0_-4px_0_inset_var(--color-primary)]" : "text-on-surface-variant hover:bg-white/40"}`}>
                    <span className="material-symbols-outlined">workspace_premium</span>
                    الشهادات والمدرسة
                </button>
            </div>

            <div className="p-8 lg:p-12 space-y-12">
                {tab === "general" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {['grades', 'departments', 'sections'].map(key => (
                            <div key={key}>
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                                        <h4 className="font-black text-lg text-on-surface">
                                            {key === 'grades' ? 'الصفوف الدراسية' : key === 'departments' ? 'الأقسام العلمية' : 'الشعب'}
                                        </h4>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {newItem.key === key ? (
                                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newItem.value}
                                                    onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddItem(key)}
                                                    className="px-3 py-2 bg-white rounded-xl text-xs font-bold border border-primary/30 focus-glow"
                                                    placeholder="اكتب هنا..."
                                                />
                                                <button onClick={() => handleAddItem(key)} className="p-2 bg-primary text-white rounded-xl hover:bg-primary-dim transition-colors">
                                                    <span className="material-symbols-outlined text-sm">done</span>
                                                </button>
                                                <button onClick={() => setNewItem({ key: "", value: "" })} className="p-2 bg-surface-container-high text-on-surface-variant rounded-xl hover:bg-surface-container-highest transition-colors">
                                                    <span className="material-symbols-outlined text-sm">close</span>
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => setNewItem({ key, value: "" })} className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-primary/20 transition-colors">
                                                <span className="material-symbols-outlined text-sm">add</span> إضافة خيار
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {settings[key].map((item, idx) => (
                                        <span key={idx} className="bg-surface-container px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-3 border border-surface-container-high group hover:border-primary/30 transition-colors">
                                            {item}
                                            <button onClick={() => removeItem(key, idx)} className="text-error/40 hover:text-error transition-colors">
                                                <span className="material-symbols-outlined text-[18px]">cancel</span>
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {tab === "scoring" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button
                                onClick={() => setSettings({...settings, activeScoringSystem: "average"})}
                                className={`p-8 rounded-3xl border-2 text-right transition-all group ${settings.activeScoringSystem === "average" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-surface-container hover:border-surface-container-highest"}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${settings.activeScoringSystem === "average" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant group-hover:scale-110"}`}>
                                    <span className="material-symbols-outlined text-3xl">analytics</span>
                                </div>
                                <h5 className="font-bold text-xl mb-2">المتوسط الحسابي</h5>
                                <p className="text-sm text-on-surface-variant leading-relaxed">يتم احتساب النتيجة النهائية كمتوسط لمجموع درجات المواد المسجلة للطالب.</p>
                            </button>
                            <button
                                onClick={() => setSettings({...settings, activeScoringSystem: "sum"})}
                                className={`p-8 rounded-3xl border-2 text-right transition-all group ${settings.activeScoringSystem === "sum" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-surface-container hover:border-surface-container-highest"}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all ${settings.activeScoringSystem === "sum" ? "bg-primary text-white" : "bg-surface-container-high text-on-surface-variant group-hover:scale-110"}`}>
                                    <span className="material-symbols-outlined text-3xl">functions</span>
                                </div>
                                <h5 className="font-bold text-xl mb-2">المجموع الكلي</h5>
                                <p className="text-sm text-on-surface-variant leading-relaxed">يتم عرض مجموع الدرجات الفعلي لجميع المواد دون قسمتها على العدد.</p>
                            </button>
                        </div>

                        <div className="p-8 bg-surface-container-low rounded-[32px] border border-surface-container">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="font-bold text-lg mb-1">الدرجة القصوى للمادة</h4>
                                    <p className="text-xs text-on-surface-variant">تُستخدم هذه القيمة كمرجع للنسب المئوية والرسوم البيانية.</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={settings.maxTotal}
                                        onChange={(e) => setSettings({...settings, maxTotal: parseInt(e.target.value)})}
                                        className="w-32 px-6 py-4 bg-white rounded-2xl focus-glow font-black text-2xl text-center shadow-sm border border-surface-container"
                                    />
                                    <span className="font-bold text-on-surface-variant">درجة</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {tab === "advanced" && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-8 bg-surface-container-low rounded-[32px] border border-surface-container flex flex-col md:flex-row items-center gap-8">
                            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-inner ${settings.isCertificateEnabled ? 'bg-green-100 text-green-600' : 'bg-surface-container-highest text-on-surface-variant'}`}>
                                <span className="material-symbols-outlined">workspace_premium</span>
                            </div>
                            <div className="flex-1 text-center md:text-right">
                                <h4 className="font-bold text-xl mb-1">استخراج الشهادات الملونة</h4>
                                <p className="text-sm text-on-surface-variant leading-relaxed">عند التفعيل، سيظهر زر "الشهادة النهائية" في حسابات الطلاب لتمكينهم من تحميل شهادة النتائج الرسمية.</p>
                            </div>
                            <button
                                onClick={() => setSettings({...settings, isCertificateEnabled: !settings.isCertificateEnabled})}
                                className={`w-20 h-10 rounded-full transition-all relative p-1 shadow-inner ${settings.isCertificateEnabled ? 'bg-primary' : 'bg-surface-container-highest'}`}
                            >
                                <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-md transition-all ${settings.isCertificateEnabled ? 'right-1' : 'right-11'}`}></div>
                            </button>
                        </div>

                        <div className="p-8 bg-surface-container-low rounded-[32px] border border-surface-container">
                            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">event_repeat</span>
                                الدور الدراسي الحالي
                            </h4>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setSettings({...settings, currentRound: "الأول"})}
                                    className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${settings.currentRound === "الأول" ? "border-primary bg-primary/10 text-primary" : "border-surface-container hover:bg-surface-container-high"}`}
                                >
                                    الدور الأول
                                </button>
                                <button
                                    onClick={() => setSettings({...settings, currentRound: "الثاني"})}
                                    className={`flex-1 py-4 rounded-2xl font-bold border-2 transition-all ${settings.currentRound === "الثاني" ? "border-primary bg-primary/10 text-primary" : "border-surface-container hover:bg-surface-container-high"}`}
                                >
                                    الدور الثاني
                                </button>
                            </div>
                        </div>

                        <div className="p-8 bg-surface-container-low rounded-[32px] border border-surface-container">
                            <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">school</span>
                                هوية المؤسسة التعليمية
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-on-surface-variant px-2 block uppercase tracking-wider">اسم المنصة / المدرسة</label>
                                    <input
                                        type="text"
                                        value={settings.schoolName || ""}
                                        onChange={(e) => setSettings({...settings, schoolName: e.target.value})}
                                        className="w-full px-8 py-5 bg-white rounded-2xl focus-glow font-bold text-lg shadow-sm border border-surface-container"
                                        placeholder="GradeX"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-on-surface-variant px-2 block uppercase tracking-wider">شعار المنصة (Logo)</label>
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-surface-container flex items-center justify-center overflow-hidden shrink-0">
                                            {settings.logo ? (
                                                <img src={resolveImageUrl(settings.logo)} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined text-outline">image</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => setIsLogoModalOpen(true)}
                                            className="flex-1 px-6 py-4 bg-white rounded-2xl border-2 border-dashed border-primary/30 text-primary font-bold hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined">upload_file</span>
                                            تغيير الشعار
                                        </button>
                                    </div>
                                    <ImageUploadModal
                                        isOpen={isLogoModalOpen}
                                        onClose={() => setIsLogoModalOpen(false)}
                                        onUpload={handleLogoUpload}
                                        title="تغيير شعار المنصة"
                                        aspect={1}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-on-surface-variant px-2 block uppercase tracking-wider">اسم المصمم / المطور</label>
                                    <input
                                        type="text"
                                        value={settings.developerName || ""}
                                        onChange={(e) => setSettings({...settings, developerName: e.target.value})}
                                        className="w-full px-8 py-5 bg-white rounded-2xl focus-glow font-bold text-lg shadow-sm border border-surface-container"
                                        placeholder="عبدالقادر محمد"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-xs font-bold text-on-surface-variant px-2 block uppercase tracking-wider">السنة الأكاديمية</label>
                                    <input
                                        type="text"
                                        value={settings.academicYear || ""}
                                        onChange={(e) => setSettings({...settings, academicYear: e.target.value})}
                                        className="w-full px-8 py-5 bg-white rounded-2xl focus-glow font-bold text-lg shadow-sm border border-surface-container"
                                        placeholder="2025 - 2026"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
