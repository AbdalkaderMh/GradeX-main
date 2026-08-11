import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSearch } from "../hooks/SearchContext";
import { useMobileNav } from "../App";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import api from "../api/axios";
import { resolveImageUrl } from "../utils/url";

export default function Navbar({ title }) {
  const navigate = useNavigate();
  const { logout, settings, user: authUser } = useAuth();
  const {
    notifications,
    markAsRead,
    markAllRead,
    clearAllNotifications
  } = useNotification();
  const { searchQuery, setSearchQuery } = useSearch();
  const { setSidebarOpen } = useMobileNav();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(localStorage.getItem("theme") === "dark");

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest(".notifications-dropdown") && !event.target.closest(".notification-trigger")) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (event) => {
        if (event.key === "Escape") setShowNotifications(false);
    };
    const handleStorageChange = (e) => {
        if (e.key === "theme") {
            setIsDark(e.newValue === "dark");
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("storage", handleStorageChange);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("storage", handleStorageChange);
    };
  }, [showNotifications]);

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (authUser) {
      setProfile(authUser);
      // Optional: fetch fresh data but authUser should be kept in sync
      api.get("/auth/profile").then(res => setProfile(res.data.user)).catch(() => {});
    }
  }, [authUser]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-nav flex flex-row-reverse justify-between items-center w-full px-4 lg:px-8 py-3 editorial-shadow transition-colors duration-500">
      <div className="flex items-center gap-2 lg:gap-4 flex-row-reverse">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 text-on-surface-variant hover:bg-blue-50/50 rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
        <Link to="/profile" className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden border-2 border-primary-container hover:scale-105 transition-transform active:scale-95">
          {profile?.avatar ? (
            <img
              className="w-full h-full object-cover"
              alt="Profile"
              src={resolveImageUrl(profile.avatar)}
            />
          ) : (
            <span className="material-symbols-outlined text-primary-container">person</span>
          )}
        </Link>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 text-on-surface-variant hover:bg-blue-50/50 rounded-full transition-all duration-300"
            title={isDark ? "تفعيل الوضع المضيء" : "تفعيل الوضع الليلي"}
          >
            <span className="material-symbols-outlined transition-transform duration-500" style={{ transform: isDark ? 'rotate(180deg)' : 'rotate(0)' }}>
              {isDark ? "light_mode" : "dark_mode"}
            </span>
          </button>

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full transition-colors relative notification-trigger ${showNotifications ? 'bg-blue-100 text-primary' : 'text-on-surface-variant hover:bg-blue-50/50'}`}
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-error rounded-full border-2 border-surface shadow-sm"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-surface-container-lowest rounded-2xl oceanic-shadow z-[70] overflow-hidden border border-white/40 animate-in fade-in slide-in-from-top-2 duration-200 notifications-dropdown">
              <div className="p-4 bg-surface-variant/50 border-b border-surface-container flex items-center justify-between">
                <span className="font-bold text-sm">التنبيهات</span>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-[10px] text-primary font-bold hover:underline">
                            تحديد الكل كمقروء
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button onClick={clearAllNotifications} className="text-[10px] text-error font-bold hover:underline">
                            مسح الكل
                        </button>
                    )}
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-surface-container">
                        {notifications.map(n => (
                            <div
                                key={n._id}
                                onClick={() => {
                                    markAsRead(n._id);
                                    if (n.link) navigate(n.link);
                                    setShowNotifications(false);
                                }}
                                className={`p-4 text-right cursor-pointer transition-colors hover:bg-surface-container-low ${!n.isRead ? 'bg-primary/5' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] text-on-surface-variant/60">
                                        {new Date(n.createdAt).toLocaleDateString('ar-EG')}
                                    </span>
                                    <span className={`text-xs font-bold ${!n.isRead ? 'text-primary' : 'text-on-surface'}`}>
                                        {n.title}
                                    </span>
                                </div>
                                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                                    {n.message}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <div className="w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center mx-auto mb-3 text-on-surface-variant/40">
                            <span className="material-symbols-outlined">notifications_off</span>
                        </div>
                        <p className="text-xs text-on-surface-variant font-medium">لا توجد تنبيهات حالياً</p>
                    </div>
                )}
              </div>
            </div>
          )}
          <button
            className="p-2 text-on-surface-variant hover:bg-blue-50/50 rounded-full transition-colors"
            onClick={handleLogout}
            title="تسجيل الخروج"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-2 lg:mx-8 hidden sm:block">
        <div className="relative flex items-center">
          <input
            className="w-full bg-surface-container-lowest border-none rounded-xl py-2 pr-10 pl-4 focus-glow text-sm"
            placeholder="بحث في النظام..."
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="material-symbols-outlined absolute right-3 text-outline">search</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
          {settings.logo ? (
            <img src={resolveImageUrl(settings.logo)} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          )}
        </div>
        <h1 className="text-xl lg:text-2xl font-extrabold text-blue-900 font-headline tracking-tight">{settings.schoolName}</h1>
        <div className="w-[1px] h-6 bg-outline-variant/30 mx-1 lg:mx-2 hidden xs:block"></div>
        <h2 className="text-sm lg:text-lg font-bold text-on-surface-variant/70 truncate hidden xs:block">{title}</h2>
      </div>
    </header>
  );
}
