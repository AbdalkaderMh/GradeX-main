import { useState, createContext, useContext, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import ManageStudents from "./pages/ManageStudents";
import Support from "./pages/Support";
import SupportInbox from "./pages/SupportInbox";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherApproval from "./pages/TeacherApproval";
import TeacherDashboard from "./pages/TeacherDashboard";
import MyStudentsTeacher from "./pages/MyStudentsTeacher";
import SharedResult from "./pages/SharedResult";
import ActivityLog from "./pages/ActivityLog";
import { PrivacyPage, ContactPage, AboutPage } from "./pages/StaticPages";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import ErrorBoundary from "./components/ErrorBoundary";
import { OptionsProvider } from "./context/OptionsContext";

const MobileNavContext = createContext();
export const useMobileNav = () => useContext(MobileNavContext);

const AdminLayout = ({ children }) => {
  const { isSidebarOpen, setSidebarOpen } = useMobileNav();
  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="بوابة الإدارة" />
      <Sidebar role="admin" isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      {children}
    </div>
  );
};

const TeacherLayout = ({ children }) => {
  const { isSidebarOpen, setSidebarOpen } = useMobileNav();
  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="بوابة المعلم" />
      <Sidebar role="teacher" isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      {children}
    </div>
  );
};

const StudentLayout = ({ children }) => {
  const { isSidebarOpen, setSidebarOpen } = useMobileNav();
  return (
    <div className="min-h-screen bg-surface">
      <Navbar title="بوابة الطالب" />
      <Sidebar role="student" isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
      {children}
    </div>
  );
};

function App() {
  const { role } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <ErrorBoundary>
    <OptionsProvider>
    <MobileNavContext.Provider value={{ isSidebarOpen, setSidebarOpen }}>
      <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/reset/:token" element={<ResetPassword />} />

      <Route
        path="/admin"
        element={role === "admin" ? <AdminLayout><AdminDashboard /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/admin/manage"
        element={role === "admin" ? <AdminLayout><ManageStudents /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/admin/support"
        element={role === "admin" ? <AdminLayout><SupportInbox /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/admin/settings"
        element={role === "admin" ? <AdminLayout><SettingsPage /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/admin/teachers"
        element={role === "admin" ? <AdminLayout><TeacherApproval /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/admin/activity"
        element={role === "admin" ? <AdminLayout><ActivityLog /></AdminLayout> : <Navigate to="/" />}
      />

      <Route
        path="/student"
        element={role === "student" ? <StudentLayout><StudentDashboard /></StudentLayout> : <Navigate to="/" />}
      />

      <Route
        path="/teacher"
        element={role === "teacher" ? <TeacherLayout><TeacherDashboard /></TeacherLayout> : <Navigate to="/" />}
      />

      <Route
        path="/teacher/students"
        element={role === "teacher" ? <TeacherLayout><MyStudentsTeacher /></TeacherLayout> : <Navigate to="/" />}
      />

      <Route
        path="/support"
        element={role ? (role === "admin" ? <AdminLayout><Support /></AdminLayout> : (role === "teacher" ? <TeacherLayout><Support /></TeacherLayout> : <StudentLayout><Support /></StudentLayout>)) : <Navigate to="/" />}
      />

      <Route
        path="/profile"
        element={role ? (role === "admin" ? <AdminLayout><Profile /></AdminLayout> : (role === "teacher" ? <TeacherLayout><Profile /></TeacherLayout> : <StudentLayout><Profile /></StudentLayout>)) : <Navigate to="/" />}
      />

        <Route path="/share/:token" element={<SharedResult />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/about" element={<AboutPage />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl z-50 flex items-center justify-center hover:scale-110 active:scale-95 transition-all animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
          <span className="material-symbols-outlined text-3xl">arrow_upward</span>
        </button>
      )}
    </MobileNavContext.Provider>
    </OptionsProvider>
    </ErrorBoundary>
  );
}

export default App;
