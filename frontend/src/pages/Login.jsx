import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../utils/url";

export default function Login() {
  const { showNotification } = useNotification();
  const { login, role, settings } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (role === "admin") navigate("/admin");
    else if (role === "teacher") navigate("/teacher");
    else if (role === "student") navigate("/student");
  }, [role, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      alert("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/auth/login", {
        username: username.trim(),
        password,
      });

      login(res.data);

      if (res.data.requiresPasswordChange) {
        navigate("/profile", { state: { mandatory: true } });
      } else if (res.data.role === "admin") {
        navigate("/admin");
      } else if (res.data.role === "teacher") {
        navigate("/teacher");
      } else {
        navigate("/student");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err.response?.data || err.message);
      alert(err.response?.data?.message || "فشل تسجيل الدخول - تحقق من البيانات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col">
      <main className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 bg-primary-container/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 bg-tertiary-container/10 rounded-full blur-3xl"></div>

        <div className="w-full max-w-md z-10">
          {/* Brand Identity */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white oceanic-shadow mb-6 overflow-hidden p-2">
              {settings.logo ? (
                <img src={resolveImageUrl(settings.logo)} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
              )}
            </div>
            <h1 className="font-headline text-3xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 to-blue-400 bg-clip-text text-transparent mb-2">
              {settings.schoolName}
            </h1>
            <p className="text-on-surface-variant font-medium opacity-80">نظام إدارة النتائج الأكاديمية</p>
          </div>

          {/* Login Card */}
          <div className="glass-card rounded-[2.5rem] p-8 md:p-12 oceanic-shadow border border-white/60 hover-lift transition-all duration-500">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-on-surface mb-2">تسجيل الدخول</h2>
              <p className="text-on-surface-variant text-sm">أدخل بياناتك الأكاديمية للوصول إلى نتائجك</p>
            </div>

            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant mr-1" htmlFor="username">اسم المستخدم</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">badge</span>
                  </div>
                  <input
                    className="w-full pr-12 pl-4 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus-glow focus:bg-white transition-all"
                    id="username"
                    placeholder="st0001, th0001, etc."
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-on-surface-variant mr-1" htmlFor="password">كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input
                    className="w-full pr-12 pl-12 py-4 bg-surface-container-low border-none rounded-xl text-on-surface placeholder:text-outline focus-glow focus:bg-white transition-all"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    className="absolute inset-y-0 left-0 pl-4 flex items-center text-outline hover:text-primary transition-colors"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center cursor-pointer group">
                  <div className="relative flex items-center">
                    <input className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-outline-variant bg-surface-container-low checked:bg-primary checked:border-primary transition-all" type="checkbox" />
                    <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 text-sm font-bold right-0.5 pointer-events-none">check</span>
                  </div>
                  <span className="mr-3 text-sm font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">تذكرني</span>
                </label>
                <Link className="text-sm font-semibold text-primary hover:text-primary-dim transition-colors" to="/contact">نسيت كلمة المرور؟</Link>
              </div>

              {/* Action Button */}
              <button
                className="w-full academic-gradient text-on-primary font-black py-5 rounded-2xl shadow-xl shadow-primary/30 hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                   <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <span className="material-symbols-outlined text-xl">analytics</span>
                )}
                <span>{loading ? "جاري تسجيل الدخول..." : "عرض النتيجة"}</span>
              </button>
            </form>

            {/* Status Notification (Subtle) */}
            <div className="mt-8 p-4 bg-tertiary-container/30 rounded-xl flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
              <p className="text-xs text-on-tertiary-container leading-relaxed">
                يتم تحديث النتائج بشكل دوري. في حال عدم ظهور النتيجة، يرجى مراجعة شؤون الطلاب.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 px-6 flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center gap-4 text-outline-variant">
          <div className="h-[1px] w-12 bg-outline-variant/30"></div>
          <Link to="/about" className="text-xs font-medium tracking-wide hover:text-primary transition-colors">إدارة المشروع البرمجي: {settings.developerName}</Link>
          <div className="h-[1px] w-12 bg-outline-variant/30"></div>
        </div>
        <div className="flex gap-6 text-sm font-semibold text-on-surface-variant/60">
          <Link className="hover:text-primary transition-colors" to="/privacy">سياسة الخصوصية</Link>
          <Link className="hover:text-primary transition-colors" to="/support">الدعم الفني</Link>
          <Link className="hover:text-primary transition-colors" to="/contact">اتصل بنا</Link>
        </div>
      </footer>
    </div>
  );
}
