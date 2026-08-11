import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "كلمات المرور غير متطابقة" });
    }
    if (password.length < 8) {
        return setMessage({ type: "error", text: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" });
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, newPassword: password });
      setMessage({ type: "success", text: "تم تغيير كلمة المرور بنجاح. سيتم تحويلك لصفحة الدخول..." });
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setMessage({ type: "error", text: err.response?.data?.message || "فشل إعادة تعيين كلمة المرور" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 oceanic-shadow">
        <h2 className="text-3xl font-black font-headline text-center mb-8">إعادة تعيين كلمة المرور</h2>

        {message.text && (
          <div className={`mb-6 p-4 rounded-2xl text-sm font-bold text-center ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant mr-1">كلمة المرور الجديدة</label>
            <input
              required
              type="password"
              className="w-full px-6 py-4 bg-surface-container-low rounded-2xl focus-glow"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-bold text-on-surface-variant mr-1">تأكيد كلمة المرور</label>
            <input
              required
              type="password"
              className="w-full px-6 py-4 bg-surface-container-low rounded-2xl focus-glow"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 primary-gradient text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            {loading && <span className="material-symbols-outlined animate-spin">sync</span>}
            <span>تغيير كلمة المرور</span>
          </button>
        </form>
      </div>
    </div>
  );
}
