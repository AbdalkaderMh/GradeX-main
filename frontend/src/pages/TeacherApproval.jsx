import Skeleton from "../components/Skeleton";
import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import EmptyState from "../components/EmptyState";

export default function TeacherApproval() {
  const { showNotification } = useNotification();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTeacher, setNewTeacher] = useState({ name: "", password: "", subjects: "" });
  const [editingSubjects, setEditingSubjects] = useState({});

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await api.get("/admin/teachers");
      setTeachers(res.data);
      const subjectsMap = {};
      res.data.forEach(t => {
          subjectsMap[t._id] = t.subjects.join(", ");
      });
      setEditingSubjects(subjectsMap);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleApproveOrUpdate = async (id) => {
    const teacherSubjects = editingSubjects[id];
    try {
      await api.put(`/admin/approve-teacher/${id}`, {
        subjects: teacherSubjects.split(",").map(s => s.trim()).filter(s => s !== "")
      });
      showNotification("تم تحديث بيانات المعلم بنجاح", "success");
      fetchTeachers();
    } catch (err) {
      showNotification("حدث خطأ أثناء التحديث", "error");
    }
  };

  const handleCreateTeacher = async (e) => {
      e.preventDefault();
      try {
          await api.post("/admin/teachers", {
              ...newTeacher,
              subjects: newTeacher.subjects.split(",").map(s => s.trim()).filter(s => s !== "")
          });
          showNotification("تم إنشاء حساب المعلم بنجاح", "success");
          setShowAddModal(false);
          setNewTeacher({ name: "", password: "", subjects: "" });
          fetchTeachers();
      } catch (err) {
          showNotification("فشل إنشاء الحساب", "error");
      }
  }

  const handleSubjectChange = (id, value) => {
    setEditingSubjects(prev => ({ ...prev, [id]: value }));
  };

  if (loading) return <div className="p-10 text-center animate-pulse">جاري التحميل...</div>;

  const pendingCount = teachers.filter(t => t.status === "pending").length;

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">إدارة المعلمين</h2>
            <p className="text-on-surface-variant max-w-2xl">إدارة حسابات المعلمين وتخصيص المواد الأكاديمية.</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary text-on-primary px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-primary/20 hover:bg-primary-dim transition-all flex items-center gap-2"
          >
              <span className="material-symbols-outlined">person_add</span>
              إضافة معلم جديد
          </button>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl p-6 lg:p-8 oceanic-shadow">
        <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">groups</span>
                قائمة المعلمين
            </h3>
            {pendingCount > 0 && (
                <span className="bg-error/10 text-error px-4 py-1 rounded-full text-xs font-bold animate-pulse">
                    يوجد {pendingCount} طلب انضمام معلق
                </span>
            )}
        </div>

        {teachers.length === 0 ? (
            <div className="bg-surface-container-low rounded-[2rem] overflow-hidden">
                <EmptyState
                    icon="group_off"
                    title="لا يوجد معلمون"
                    message="لم يتم تسجيل أي حسابات للمعلمين في النظام حتى الآن."
                />
            </div>
        ) : (
            <div className="grid gap-6">
                {teachers.map((teacher) => (
                    <div key={teacher._id} className={`p-6 bg-white border ${teacher.status === 'pending' ? 'border-error/30' : 'border-surface-container'} rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-md transition-all`}>
                        <div className="flex items-center gap-4 text-right w-full md:w-auto">
                            <div className={`w-14 h-14 ${teacher.status === 'pending' ? 'bg-error/10 text-error' : 'bg-primary/10 text-primary'} rounded-2xl flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-3xl">school</span>
                            </div>
                            <div>
                                <h4 className="font-black text-lg flex items-center gap-2">
                                    {teacher.name}
                                    {teacher.status === 'pending' && <span className="bg-error text-white text-[10px] px-2 py-0.5 rounded-full">معلق</span>}
                                </h4>
                                <p className="text-xs font-mono text-outline-variant">{teacher.username}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto flex-1 max-w-2xl">
                            <div className="relative w-full">
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-sm">book</span>
                                <input
                                    placeholder="أدخل المواد مفصولة بفاصلة"
                                    className="w-full bg-surface-container-low pr-12 pl-4 py-3 rounded-2xl text-sm focus-glow"
                                    value={editingSubjects[teacher._id] || ""}
                                    onChange={(e) => handleSubjectChange(teacher._id, e.target.value)}
                                />
                            </div>
                            <button
                                onClick={() => handleApproveOrUpdate(teacher._id)}
                                className={`w-full md:w-auto ${teacher.status === 'pending' ? 'bg-error text-white shadow-error/20' : 'bg-primary text-on-primary shadow-primary/20'} px-8 py-3 rounded-2xl font-bold text-sm shadow-lg hover:scale-95 transition-all whitespace-nowrap`}
                            >
                                {teacher.status === 'pending' ? 'موافقة وتخصيص' : 'تحديث المواد'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm p-4">
              <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md oceanic-shadow">
                  <h3 className="text-2xl font-black mb-6">إضافة معلم جديد</h3>
                  <form onSubmit={handleCreateTeacher} className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold mb-2 mr-1">اسم المعلم</label>
                          <input
                            required
                            className="w-full bg-surface-container-low px-5 py-3 rounded-2xl focus-glow"
                            value={newTeacher.name}
                            onChange={e => setNewTeacher({...newTeacher, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold mb-2 mr-1">كلمة المرور</label>
                          <input
                            required
                            type="password"
                            className="w-full bg-surface-container-low px-5 py-3 rounded-2xl focus-glow"
                            value={newTeacher.password}
                            onChange={e => setNewTeacher({...newTeacher, password: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-bold mb-2 mr-1">المواد (مفصولة بفاصلة)</label>
                          <input
                            placeholder="رياضيات, فيزياء..."
                            className="w-full bg-surface-container-low px-5 py-3 rounded-2xl focus-glow"
                            value={newTeacher.subjects}
                            onChange={e => setNewTeacher({...newTeacher, subjects: e.target.value})}
                          />
                      </div>
                      <div className="flex gap-4 mt-8">
                          <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 font-bold text-outline">إلغاء</button>
                          <button type="submit" className="flex-[2] py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20">إنشاء الحساب</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </main>
  );
}
