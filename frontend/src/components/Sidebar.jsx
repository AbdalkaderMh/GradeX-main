import { useNotification } from "../context/NotificationContext";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { resolveImageUrl } from "../utils/url";

export default function Sidebar({ role, isOpen, onClose }) {
  const { showNotification } = useNotification();
  const { settings } = useAuth();
  const location = useLocation();
  const isAdmin = role === "admin";
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await api.get("/admin/export-students", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "all_students_credentials.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("فشل تحميل البيانات");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
    {/* Backdrop */}
    {isOpen && (
      <div
        className="fixed inset-0 bg-on-surface/20 backdrop-blur-sm z-40 lg:hidden"
        onClick={onClose}
      ></div>
    )}

    <aside className={`flex flex-col h-screen fixed right-0 top-0 pt-8 lg:pt-20 pb-8 z-40 bg-white/80 backdrop-blur-xl docked w-72 border-l border-surface-container font-body font-normal text-right transition-all duration-500 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'}`}>
      <div className="flex lg:hidden justify-start px-6 mb-4">
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="px-8 mb-10">
        <div className="flex flex-row-reverse items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden">
            {settings.logo ? (
              <img src={resolveImageUrl(settings.logo)} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="material-symbols-outlined">school</span>
            )}
          </div>
          <div>
            <h2 className="text-lg font-bold text-blue-800">{settings.schoolName}</h2>
            <p className="text-xs text-on-surface-variant opacity-70">نظام إدارة التعلم</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        <Link
          to={isAdmin ? "/admin" : (role === "teacher" ? "/teacher" : "/student")}
          onClick={onClose}
          className={`flex flex-row-reverse items-center justify-start gap-4 py-3.5 px-6 rounded-2xl transition-all duration-300 ${location.pathname === (isAdmin ? "/admin" : (role === "teacher" ? "/teacher" : "/student")) ? 'bg-primary/10 text-primary font-black shadow-sm' : 'text-on-surface-variant hover:bg-surface-container-low hover:translate-x-[-4px]'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: location.pathname === (isAdmin ? "/admin" : (role === "teacher" ? "/teacher" : "/student")) ? "'FILL' 1" : "" }}>dashboard</span>
          <span className="text-sm">لوحة القيادة</span>
        </Link>

        {isAdmin && (
          <>
            <Link
              to="/admin/manage"
              onClick={onClose}
              className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === "/admin/manage" ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <span className="material-symbols-outlined">grade</span>
              <span className="text-sm">إدارة الطلاب</span>
            </Link>
            <Link
              to="/admin/teachers"
              onClick={onClose}
              className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === "/admin/teachers" ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <span className="material-symbols-outlined">group_add</span>
              <span className="text-sm">إدارة المعلمين</span>
            </Link>
            <Link
              to="/admin/activity"
              onClick={onClose}
              className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === "/admin/activity" ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <span className="material-symbols-outlined">history</span>
              <span className="text-sm">سجل النشاطات</span>
            </Link>
            <Link
              to="/admin/settings"
              onClick={onClose}
              className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === "/admin/settings" ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm">إعدادات النظام</span>
            </Link>
          </>
        )}

        {role === "teacher" && (
           <Link
              to="/teacher/students"
              onClick={onClose}
              className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === "/teacher/students" ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <span className="material-symbols-outlined">groups</span>
              <span className="text-sm">طلابي</span>
            </Link>
        )}


        <Link
          to={isAdmin ? "/admin/support" : "/support"}
          onClick={onClose}
          className={`flex flex-row-reverse items-center justify-start gap-4 py-3 px-6 transition-all ${location.pathname === (isAdmin ? "/admin/support" : "/support") ? 'bg-blue-100/50 text-blue-700 border-r-4 border-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-200'}`}
        >
          <span className="material-symbols-outlined">support_agent</span>
          <span className="text-sm">{isAdmin ? "صندوق الدعم" : "الدعم"}</span>
        </Link>

        {isAdmin && (
            <div className="px-6 pt-4 mt-4 border-t border-slate-200">
                <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="w-full flex flex-row-reverse items-center justify-start gap-4 py-3 px-4 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all disabled:opacity-50 font-bold"
                >
                    <span className="material-symbols-outlined">{exporting ? 'sync' : 'key'}</span>
                    <span className="text-xs">{exporting ? 'جاري التحميل...' : 'تصدير كافة الحسابات'}</span>
                </button>
            </div>
        )}
      </nav>
    </aside>
    </>
  );
}
