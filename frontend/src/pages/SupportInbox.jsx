import { useNotification } from "../context/NotificationContext";
import { useState, useEffect } from "react";
import api from "../api/axios";
import { useSearch } from "../hooks/SearchContext";
import EmptyState from "../components/EmptyState";
import Footer from "../components/Footer";

export default function SupportInbox() {
  const { showNotification } = useNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [activeReplyId, setActiveReplyId] = useState(null);
  const { searchQuery } = useSearch();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await api.get("/support/all");
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status, reply = "") => {
    try {
      await api.put(`/support/${id}`, { status, reply });
      setMessages(messages.map(m => m._id === id ? { ...m, status, reply } : m));
      setActiveReplyId(null);
      setReplyText("");
    } catch (err) {
      showNotification("فشل تحديث حالة الرسالة", "error");
    }
  };

  return (
    <main className="lg:mr-64 pt-24 pb-12 px-4 lg:px-10">
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h2 className="text-3xl lg:text-4xl font-extrabold text-on-surface font-headline tracking-tight mb-2">صندوق الدعم الفني</h2>
          <p className="text-on-surface-variant max-w-2xl text-sm lg:text-base">إدارة طلبات الدعم والمشاكل التقنية الواردة من الطلاب.</p>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 lg:px-8 py-6 bg-surface-variant flex flex-row-reverse items-center justify-between border-r-4 border-primary">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">inbox</span>
            <h3 className="text-xl lg:text-2xl font-bold font-headline text-right">الرسائل الواردة</h3>
          </div>
          <button onClick={fetchMessages} className="p-2 hover:bg-surface-container-high rounded-lg transition-colors">
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[700px]">
            <thead>
              <tr className="bg-surface-container-low/50 text-on-surface-variant text-sm font-medium">
                <th className="px-6 py-4">التاريخ</th>
                <th className="px-6 py-4">المرسل</th>
                <th className="px-6 py-4">الرسالة</th>
                <th className="px-6 py-4">الحالة</th>
                <th className="px-6 py-4">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-10 text-center text-primary font-bold animate-pulse">جاري تحميل الرسائل...</td>
                </tr>
              ) : messages
                .filter(m =>
                    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    m.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((m) => (
                <tr key={m._id} className="hover:bg-surface-container-low transition-colors align-top">
                  <td className="px-6 py-6 text-xs text-on-surface-variant font-mono">
                    {new Date(m.createdAt).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-bold">{m.name}</div>
                    <div className="text-xs text-on-surface-variant opacity-70">{m.email}</div>
                  </td>
                  <td className="px-6 py-6 max-w-xs">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                  </td>
                  <td className="px-6 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${m.status === 'solved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {m.status === 'solved' ? 'تم الحل' : 'قيد الانتظار'}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    {m.status === 'pending' ? (
                      <div className="flex flex-col gap-2">
                        {activeReplyId === m._id ? (
                            <div className="flex flex-col gap-2 min-w-[200px] animate-in slide-in-from-left-2">
                                <textarea
                                    className="w-full p-2 text-xs bg-surface-container-low rounded-lg focus-glow"
                                    placeholder="اكتب الرد هنا..."
                                    rows="2"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(m._id, 'solved', replyText)}
                                        className="flex-1 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold"
                                    >
                                        إرسال وحل
                                    </button>
                                    <button
                                        onClick={() => setActiveReplyId(null)}
                                        className="px-2 py-1.5 bg-surface-container-high rounded-lg text-[10px]"
                                    >
                                        إلغاء
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setActiveReplyId(m._id)}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all"
                            >
                                الرد والحل
                            </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleStatusUpdate(m._id, 'pending')}
                          className="px-4 py-2 bg-surface-container-high text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-highest transition-all"
                        >
                          إعادة فتح
                        </button>
                        {m.reply && (
                            <div className="text-[10px] bg-surface-container-high/50 p-2 rounded italic text-on-surface-variant max-w-[200px]">
                                <span className="font-bold block mb-1">ردك:</span>
                                {m.reply}
                            </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && messages.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-10">
                    <EmptyState
                        icon="mail_outline"
                        title="الصندوق فارغ"
                        message="لم يتم استلام أي طلبات دعم أو رسائل من المستخدمين حتى هذه اللحظة."
                    />
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
