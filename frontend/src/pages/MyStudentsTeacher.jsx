import { useState, useEffect } from "react";
import api from "../api/axios";
import Footer from "../components/Footer";

export default function MyStudentsTeacher() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/admin/my-students");
      setStudents(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.userId.name.toLowerCase().includes(search.toLowerCase()) ||
    s.userId.username.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center animate-pulse">جاري التحميل...</div>;

  return (
    <main className="lg:mr-64 pt-24 px-4 lg:px-8 pb-12 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">طلابي</h2>
            <p className="text-on-surface-variant max-w-2xl">قائمة الطلاب المسجلين في المواد التي تدرسها.</p>
          </div>
          <div className="relative w-full md:w-72">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline">search</span>
              <input
                type="text"
                placeholder="بحث بالاسم أو اسم المستخدم..."
                className="w-full bg-white oceanic-shadow pr-12 pl-4 py-3 rounded-2xl text-sm focus-glow border-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
          </div>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl overflow-hidden oceanic-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">اسم الطالب</th>
                <th className="px-6 py-4">اسم المستخدم</th>
                <th className="px-6 py-4">الصف الدراسي</th>
                <th className="px-6 py-4">القسم</th>
                <th className="px-6 py-4">المواد المسجلة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {filteredStudents.map((student) => (
                <tr key={student._id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4 font-black">{student.userId.name}</td>
                  <td className="px-6 py-4 font-mono text-sm text-primary">{student.userId.username}</td>
                  <td className="px-6 py-4">{student.grade}</td>
                  <td className="px-6 py-4">{student.department}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {student.subjects.map((sub, i) => (
                        <span key={i} className="bg-tertiary-container text-on-tertiary-container text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-outline-variant italic">
                    {search ? "لا توجد نتائج تطابق بحثك" : "لا يوجد طلاب مسجلون حالياً"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Footer />
    </main>
  );
}
