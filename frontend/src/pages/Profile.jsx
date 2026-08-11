import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Footer from "../components/Footer";
import ImageUploadModal from "../components/ImageUploadModal";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../utils/url";

export default function Profile() {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateAuthUser } = useAuth();
  const isMandatory = location.state?.mandatory;

  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ name: "", password: "" });
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState(null);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api.get("/auth/profile").then((res) => {
      const { user: userData, profile } = res.data;
      setUser({ ...userData, ...profile }); // Merge user and profile data
      setForm({ name: userData.name, password: "" });
      setLoading(false);
    });
  }, []);

  const validatePassword = (pass) => {
    if (!pass) return true;
    if (pass.length < 8) {
      setPasswordError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMandatory && !form.password) {
        setPasswordError("يجب تغيير كلمة المرور عند تسجيل الدخول لأول مرة");
        return;
    }
    if (!validatePassword(form.password)) return;

    setUpdating(true);
    setMessage(null);
    try {
      await api.put("/auth/profile", form);
      setMessage({ type: "success", text: "تم تحديث الملف الشخصي بنجاح" });
      setForm({ ...form, password: "" });

      if (isMandatory) {
          // Redirect to appropriate dashboard after mandatory change
          const role = localStorage.getItem("role");
          setTimeout(() => {
              if (role === "admin") navigate("/admin");
              else if (role === "teacher") navigate("/teacher");
              else navigate("/student");
          }, 1500);
      }
    } catch (err) {
      setMessage({ type: "error", text: "فشل تحديث الملف الشخصي" });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (blob) => {
    const formData = new FormData();
    formData.append("avatar", blob);
    try {
        const res = await api.post("/auth/upload-avatar", formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        const newAvatar = res.data.avatar;
        setUser({ ...user, avatar: newAvatar });

        // Update AuthContext (which also updates localStorage)
        updateAuthUser({ avatar: newAvatar });

        setMessage({ type: "success", text: "تم تحديث الصورة الشخصية بنجاح" });
    } catch (err) {
        setMessage({ type: "error", text: "فشل في رفع الصورة" });
    }
  };

  if (loading) return (
    <main className="mr-64 pt-24 px-8 pb-12 min-h-screen flex items-center justify-center">
      <div className="text-xl font-bold animate-pulse text-primary">جاري تحميل الملف الشخصي...</div>
    </main>
  );

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <section className="mb-10">
          <h2 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2">الملف الشخصي</h2>
          <p className="text-on-surface-variant text-lg">إدارة بياناتك الشخصية وإعدادات الحساب</p>
        </section>

        <div className="grid grid-cols-12 gap-8">
          {/* Main Profile Info */}
          <div className="col-span-12 lg:col-span-7">
            <div className="glass-card rounded-[2.5rem] p-10 oceanic-shadow border border-white/60">
              <h3 className="text-2xl font-bold mb-8">البيانات الأساسية</h3>

              {isMandatory && (
                <div className="mb-6 p-4 bg-primary/10 border-r-4 border-primary rounded-xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">security_update_good</span>
                  <p className="text-sm font-bold text-on-surface">يرجى تغيير كلمة المرور الافتراضية للمتابعة</p>
                </div>
              )}

              {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  <span className="material-symbols-outlined">{message.type === 'success' ? 'check_circle' : 'error'}</span>
                  <span className="text-sm font-bold">{message.text}</span>
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">
                      الاسم الكامل {user.role !== 'admin' && "(تواصل مع الإدارة لتغيير الاسم)"}
                  </label>
                  <input
                    className={`w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface ${user.role !== 'admin' ? 'cursor-not-allowed opacity-70' : 'focus-glow'}`}
                    type="text"
                    value={form.name || ""}
                    readOnly={user.role !== 'admin'}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">اسم المستخدم (غير قابل للتعديل)</label>
                  <input
                    className="w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface-variant/50 cursor-not-allowed"
                    type="text"
                    value={user.username || ""}
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-on-surface-variant mr-1">كلمة مرور جديدة (اتركها فارغة إذا لم ترد التغيير)</label>
                  <div className="relative group">
                    <input
                      className="w-full px-6 py-4 bg-surface-container-low border-none rounded-xl text-on-surface focus-glow"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={form.password || ""}
                      onChange={(e) => {
                          setForm({...form, password: e.target.value});
                          if (e.target.value) validatePassword(e.target.value);
                          else setPasswordError("");
                      }}
                    />
                    <button
                      className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline hover:text-primary transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                    </button>
                  </div>
                  {passwordError && <p className="text-xs text-error font-bold mt-1 mr-1">{passwordError}</p>}
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-4 primary-gradient text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {updating && <span className="material-symbols-outlined animate-spin">sync</span>}
                  <span>حفظ التغييرات</span>
                </button>
              </form>
            </div>
          </div>

          {/* Academic/Role Sidebar */}
          <div className="col-span-12 lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 oceanic-shadow text-center border border-surface-container">
              <div className="relative w-28 h-28 mx-auto mb-4 group">
                <div className="w-full h-full bg-primary/10 rounded-full flex items-center justify-center text-primary overflow-hidden border-4 border-white shadow-lg">
                  {user.avatar ? (
                    <img src={resolveImageUrl(user.avatar)} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                      {user.role === 'admin' ? 'admin_panel_settings' : 'person'}
                    </span>
                  )}
                </div>
                <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform"
                >
                    <span className="material-symbols-outlined text-xl">photo_camera</span>
                </button>
              </div>
              <ImageUploadModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onUpload={handleAvatarUpload}
                title="تغيير الصورة الشخصية"
                aspect={1}
              />
              <h4 className="text-xl font-bold">{user.name}</h4>
              <p className="text-sm text-on-surface-variant mb-6 uppercase tracking-widest font-bold opacity-60">
                {user.role === 'admin' ? 'مدير النظام' : 'طالب'}
              </p>

              {user.role === 'student' && (
                <div className="space-y-3 pt-6 border-t border-surface-container">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">الصف الأكاديمي:</span>
                    <span className="font-bold text-primary">{user.grade}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">التخصص / القسم:</span>
                    <span className="font-bold text-primary">{user.department}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-on-surface-variant">الشعبة:</span>
                    <span className="font-bold text-primary">{user.section}</span>
                  </div>
                </div>
              )}

              {user.role === 'teacher' && (
                  <div className="space-y-3 pt-6 border-t border-surface-container">
                      <p className="text-xs font-bold text-on-surface-variant mb-2">المواد المسندة إليك:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                          {user.subjects?.map((s, idx) => (
                              <span key={idx} className="bg-primary/10 text-primary text-[10px] px-3 py-1 rounded-full font-bold">
                                  {s}
                              </span>
                          ))}
                          {(!user.subjects || user.subjects.length === 0) && (
                              <span className="text-xs italic text-outline">لم يتم إسناد مواد بعد</span>
                          )}
                      </div>
                  </div>
              )}
            </div>

            <div className="p-8 bg-tertiary-container/10 rounded-3xl border border-tertiary-container/20">
               <h4 className="font-bold text-tertiary mb-4 flex items-center gap-2">
                 <span className="material-symbols-outlined">security</span>
                 أمان الحساب
               </h4>
               <p className="text-sm text-on-tertiary-container/80 leading-relaxed">
                 ننصح بتغيير كلمة المرور بشكل دوري واستخدام كلمة مرور قوية تتكون من حروف وأرقام ورموز.
               </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
