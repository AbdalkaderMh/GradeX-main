import { useState, useEffect } from "react";
import api from "../api/axios";
import Skeleton from "../components/Skeleton";
import Footer from "../components/Footer";

export default function ActivityLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/audit-logs?page=${page}`);
      setLogs(res.data.logs);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to fetch audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const getActionColor = (action) => {
    if (action.includes("delete")) return "text-error";
    if (action.includes("upload") || action.includes("publish")) return "text-primary";
    if (action.includes("create")) return "text-green-600";
    return "text-on-surface";
  };

  return (
    <main className="lg:mr-64 pt-24 pb-12 px-4 lg:px-10">
      <div className="mb-10">
        <h2 className="text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">سجل النشاطات</h2>
        <p className="text-on-surface-variant max-w-2xl">مراقبة كافة العمليات الإدارية التي تمت على النظام وتتبع التغييرات.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-[2.5rem] oceanic-shadow border border-surface-container overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant text-sm font-medium">
                <th className="px-6 py-5">الوقت</th>
                <th className="px-6 py-5">المسؤول</th>
                <th className="px-6 py-5">الإجراء</th>
                <th className="px-6 py-5">الهدف</th>
                <th className="px-6 py-5">التفاصيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-surface-container-high rounded w-full"></div></td>
                  </tr>
                ))
              ) : logs.map((log) => (
                <tr key={log._id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-outline">
                    {new Date(log.createdAt).toLocaleString('ar-EG')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-sm">{log.actorName}</div>
                    <div className="text-[10px] text-outline uppercase">{log.actorRole}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-black uppercase ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-sm">
                    {log.target}
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs truncate text-[10px] text-on-surface-variant font-mono bg-surface-container-high px-2 py-1 rounded">
                        {JSON.stringify(log.details)}
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && logs.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center text-on-surface-variant opacity-50">لا توجد سجلات حالياً</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 py-6 border-t border-surface-container">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-2 disabled:opacity-30 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <span className="text-sm font-bold">صفحة {page} من {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 disabled:opacity-30 hover:bg-surface-container-high rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            </div>
          )}
      </div>
      <Footer />
    </main>
  );
}
